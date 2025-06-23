/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, autorun, computed, type IReactionDisposer, observable, runInAction, untracked } from 'mobx';
import { useEffect } from 'react';

import { ConfirmationDialog, useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlCompletionProposal, SqlDialectInfo, SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';
import { createLastPromiseGetter, debounceAsync, type LastPromiseGetter, throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures.js';
import type { ISqlDataSource, ISqlEditorCursor } from '../SqlDataSource/ISqlDataSource.js';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService.js';
import { SqlDialectInfoService } from '../SqlDialectInfoService.js';
import { SqlEditorService } from '../SqlEditorService.js';
import { type ISQLScriptSegment, SQLParser } from '../SQLParser.js';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService.js';
import { OUTPUT_LOGS_TAB_ID } from '../SqlResultTabs/OutputLogs/OUTPUT_LOGS_TAB_ID.js';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService.js';
import { SqlResultTabsService } from '../SqlResultTabs/SqlResultTabsService.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import { SQLEditorModeContext } from './SQLEditorModeContext.js';

interface ISQLEditorDataPrivate extends ISQLEditorData {
  readonly sqlDialectInfoService: SqlDialectInfoService;
  readonly connectionExecutionContextService: ConnectionExecutionContextService;
  readonly sqlQueryService: SqlQueryService;
  readonly sqlEditorService: SqlEditorService;
  readonly notificationService: NotificationService;
  readonly sqlExecutionPlanService: SqlExecutionPlanService;
  readonly commonDialogService: CommonDialogService;
  readonly sqlResultTabsService: SqlResultTabsService;
  readonly dataSource: ISqlDataSource | undefined;
  readonly getLastAutocomplete: LastPromiseGetter<SqlCompletionProposal[]>;
  readonly parseScript: LastPromiseGetter<SqlScriptInfoFragment>;

  cursor: ISqlEditorCursor;
  readonlyState: boolean;
  executingScript: boolean;
  state: ISqlEditorTabState;
  reactionDisposer: IReactionDisposer | null;
  hintsLimitIsMet: boolean;
  updateParserScripts(): Promise<void>;
  loadDatabaseDataModels(): Promise<void>;
  getExecutingQuery(script: boolean): ISQLScriptSegment | undefined;
  getSubQuery(): ISQLScriptSegment | undefined;
}

const MAX_HINTS_LIMIT = 200;

export function useSqlEditor(state: ISqlEditorTabState): ISQLEditorData {
  const connectionExecutionContextService = useService(ConnectionExecutionContextService);
  const sqlQueryService = useService(SqlQueryService);
  const sqlDialectInfoService = useService(SqlDialectInfoService);
  const sqlEditorService = useService(SqlEditorService);
  const notificationService = useService(NotificationService);
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const sqlResultTabsService = useService(SqlResultTabsService);
  const commonDialogService = useService(CommonDialogService);
  const sqlDataSourceService = useService(SqlDataSourceService);

  const data = useObservableRef<ISQLEditorDataPrivate>(
    () => ({
      get dataSource(): ISqlDataSource | undefined {
        return sqlDataSourceService.get(this.state.editorId);
      },
      get dialect(): SqlDialectInfo | undefined {
        const executionContext = this.dataSource?.executionContext;
        if (!executionContext) {
          return undefined;
        }

        return this.sqlDialectInfoService.getDialectInfo(createConnectionParam(executionContext.projectId, executionContext.connectionId));
      },

      activeSegmentMode: {
        activeSegment: undefined,
        activeSegmentMode: false,
      },

      get activeSegment(): ISQLScriptSegment | undefined {
        return this.activeSegmentMode.activeSegment;
      },

      get cursorSegment(): ISQLScriptSegment | undefined {
        return this.parser.getSegment(this.cursor.anchor, -1);
      },

      get readonly(): boolean {
        return this.executingScript || this.readonlyState || !!this.dataSource?.isOutdated() || !!this.dataSource?.isReadonly() || !this.editing;
      },

      get editing(): boolean {
        return this.dataSource?.isEditing() ?? false;
      },

      get isScriptEmpty(): boolean {
        return this.value === '';
      },

      get isDisabled(): boolean {
        if (!this.dataSource?.executionContext || !this.dataSource.isLoaded()) {
          return true;
        }

        const context = this.connectionExecutionContextService.get(this.dataSource.executionContext.id);

        return context?.executing || false;
      },

      get isIncomingChanges(): boolean {
        return this.dataSource?.isIncomingChanges ?? false;
      },

      get cursor(): ISqlEditorCursor {
        return this.dataSource?.cursor ?? { anchor: 0, head: 0 };
      },

      get value(): string {
        return this.dataSource?.script ?? '';
      },

      get incomingValue(): string | undefined {
        return this.dataSource?.incomingScript;
      },

      onMode: new SyncExecutor(),
      onExecute: new SyncExecutor(),
      onSegmentExecute: new SyncExecutor(),
      onUpdate: new SyncExecutor(),
      parser: new SQLParser(),

      readonlyState: false,
      executingScript: false,
      reactionDisposer: null,
      hintsLimitIsMet: false,

      init(): void {
        if (this.reactionDisposer) {
          return;
        }

        this.parser.setScript(this.value);

        this.reactionDisposer = autorun(() => {
          const executionContext = this.dataSource?.executionContext;
          if (executionContext) {
            const context = this.connectionExecutionContextService.get(executionContext.id)?.context;
            if (context) {
              const key = createConnectionParam(context.projectId, context.connectionId);

              untracked(() => {
                this.sqlDialectInfoService.loadSqlDialectInfo(key).then(async () => {
                  try {
                    await this.updateParserScriptsDebounced();
                  } catch {}
                });
              });
            }
          }
        });
      },

      destruct(): void {
        this.reactionDisposer?.();
      },

      setCursor(begin: number, end = begin): void {
        this.dataSource?.setCursor(begin, end);
      },

      getLastAutocomplete: createLastPromiseGetter(),
      parseScript: createLastPromiseGetter(),

      getHintProposals: throttleAsync(async function getHintProposals(this: ISQLEditorDataPrivate, position, simple) {
        const executionContext = this.dataSource?.executionContext;
        if (!executionContext) {
          return [];
        }

        const hints = await this.sqlEditorService.getAutocomplete(
          executionContext.projectId,
          executionContext.connectionId,
          executionContext.id,
          this.value,
          position,
          MAX_HINTS_LIMIT,
          simple,
        );

        this.hintsLimitIsMet = hints.length >= MAX_HINTS_LIMIT;

        return hints;
      }, 300),

      async formatScript(): Promise<void> {
        if (this.isDisabled || this.isScriptEmpty || !this.dataSource?.executionContext) {
          return;
        }

        await this.updateParserScripts();
        const query = this.value;
        const script = this.getExecutingQuery(false);

        if (!script) {
          return;
        }

        this.onExecute.execute(true);
        try {
          this.readonlyState = true;
          const formatted = await this.sqlDialectInfoService.formatScript(this.dataSource.executionContext, script.query);

          this.setScript(query.substring(0, script.begin) + formatted + query.substring(script.end));
          this.setCursor(script.begin + formatted.length);
        } finally {
          this.readonlyState = false;
        }
      },

      async executeQuery(): Promise<void> {
        const isQuery = this.dataSource?.hasFeature(ESqlDataSourceFeatures.query);
        const isExecutable = this.dataSource?.hasFeature(ESqlDataSourceFeatures.executable);

        if (!isQuery || !isExecutable) {
          return;
        }

        await this.updateParserScripts();
        const query = this.getSubQuery();

        try {
          await this.executeQueryAction(await this.executeQueryAction(query, () => this.getResolvedSegment()), query =>
            this.sqlQueryService.executeEditorQuery(this.state, query.query, false),
          );
        } catch {}
      },

      async loadDatabaseDataModels(): Promise<void> {
        const query = this.getExecutingQuery(true);

        await this.executeQueryAction(
          query,
          () => {
            if (this.dataSource?.databaseModels.length) {
              this.sqlQueryService.initDatabaseDataModels(this.state);
            }
          },
          true,
          true,
        );
      },

      async executeQueryNewTab(): Promise<void> {
        const isQuery = this.dataSource?.hasFeature(ESqlDataSourceFeatures.query);
        const isExecutable = this.dataSource?.hasFeature(ESqlDataSourceFeatures.executable);

        if (!isQuery || !isExecutable) {
          return;
        }

        await this.updateParserScripts();
        const query = this.getSubQuery();

        try {
          await this.executeQueryAction(await this.executeQueryAction(query, () => this.getResolvedSegment()), query =>
            this.sqlQueryService.executeEditorQuery(this.state, query.query, true),
          );
        } catch {}
      },

      async showExecutionPlan(): Promise<void> {
        const isQuery = this.dataSource?.hasFeature(ESqlDataSourceFeatures.query);
        const isExecutable = this.dataSource?.hasFeature(ESqlDataSourceFeatures.executable);

        if (!isQuery || !isExecutable || !this.dialect?.supportsExplainExecutionPlan) {
          return;
        }

        await this.updateParserScripts();
        const query = this.getSubQuery();

        try {
          await this.executeQueryAction(await this.executeQueryAction(query, () => this.getResolvedSegment()), query =>
            this.sqlExecutionPlanService.executeExecutionPlan(this.state, query.query),
          );
        } catch {}
      },

      switchEditing(): void {
        this.dataSource?.setEditing(!this.dataSource.isEditing());
      },

      async executeScript(): Promise<void> {
        const isExecutable = this.dataSource?.hasFeature(ESqlDataSourceFeatures.executable);

        if (!isExecutable || this.isDisabled || this.isScriptEmpty) {
          return;
        }

        const processableTabs = this.state.tabs.filter(tab => tab.id !== OUTPUT_LOGS_TAB_ID);

        if (processableTabs.length > 0) {
          const result = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'sql_editor_close_result_tabs_dialog_title',
            message: `Do you want to close ${processableTabs.length} tabs before executing script?`,
            confirmActionText: 'ui_yes',
            extraStatus: 'no',
          });

          if (result === DialogueStateResult.Resolved) {
            const state = await this.sqlResultTabsService.canCloseResultTabs(this.state);

            if (!state) {
              return;
            }

            this.sqlResultTabsService.removeResultTabs(this.state, [OUTPUT_LOGS_TAB_ID]);
          } else if (result === DialogueStateResult.Rejected) {
            return;
          }
        }

        this.onExecute.execute(true);
        try {
          this.executingScript = true;
          await this.updateParserScripts();
          const queries = this.parser.scripts;

          await this.sqlQueryService.executeQueries(
            this.state,
            queries.map(query => query.query),
            {
              onQueryExecutionStart: (query, index) => {
                const segment = queries[index]!;
                this.onSegmentExecute.execute({ segment, type: 'start' });
              },
              onQueryExecuted: (query, index, success) => {
                const segment = queries[index]!;
                this.onSegmentExecute.execute({ segment, type: 'end' });

                if (!success) {
                  this.onSegmentExecute.execute({ segment, type: 'error' });
                }
              },
            },
          );
        } finally {
          this.executingScript = false;
        }
      },

      setScript(query: string, source?: string, cursor?: ISqlEditorCursor): void {
        this.dataSource?.setScript(query, source, cursor);
      },

      updateParserScriptsDebounced: debounceAsync(async function updateParserScriptsThrottle() {
        await data.updateParserScripts();
      }, 2000),

      async updateParserScripts() {
        if (!this.dataSource?.hasFeature(ESqlDataSourceFeatures.script)) {
          return;
        }
        const projectId = this.dataSource.executionContext?.projectId;
        const connectionId = this.dataSource.executionContext?.connectionId;
        const script = this.parser.actualScript;

        if (!projectId || !connectionId || !script) {
          this.parser.setQueries([]);
          this.onUpdate.execute();
          return;
        }

        const { queries } = await this.parseScript([connectionId, script], async () => {
          try {
            return await this.sqlEditorService.parseSQLScript(projectId, connectionId, script);
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Failed to parse SQL script');
            throw exception;
          }
        });

        // check if script was changed while we were waiting for response
        if (this.parser.actualScript === script) {
          this.parser.setQueries(queries);
          this.onUpdate.execute();
        }
      },

      async executeQueryAction<T>(
        segment: ISQLScriptSegment | undefined,
        action: (query: ISQLScriptSegment) => Promise<T>,
        passEmpty?: boolean,
        passDisabled?: boolean,
      ): Promise<T | undefined> {
        if (!segment || (this.isDisabled && !passDisabled) || (!passEmpty && this.isScriptEmpty)) {
          return;
        }

        this.onExecute.execute(true);

        try {
          const id = setTimeout(() => this.onSegmentExecute.execute({ segment, type: 'start' }), 250);
          const result = await action(segment);
          clearTimeout(id);
          this.onSegmentExecute.execute({ segment, type: 'end' });
          return result;
        } catch (exception: any) {
          this.onSegmentExecute.execute({ segment, type: 'end' });
          this.onSegmentExecute.execute({ segment, type: 'error' });
          throw exception;
        }
      },

      getExecutingQuery(script: boolean): ISQLScriptSegment | undefined {
        if (script) {
          return this.parser.getScriptSegment();
        }

        return this.activeSegment;
      },

      async getResolvedSegment(): Promise<ISQLScriptSegment | undefined> {
        const projectId = this.dataSource?.executionContext?.projectId;
        const connectionId = this.dataSource?.executionContext?.connectionId;

        await data.updateParserScripts();

        if (!projectId || !connectionId || this.cursor.anchor !== this.cursor.head) {
          return this.getSubQuery();
        }

        if (this.activeSegmentMode.activeSegmentMode) {
          return this.activeSegment;
        }

        const result = await this.sqlEditorService.parseSQLQuery(projectId, connectionId, this.value, this.cursor.anchor);

        if (result.end === 0 && result.start === 0) {
          return;
        }

        const segment = this.parser.getSegment(result.start, result.end);
        return segment;
      },

      getSubQuery(): ISQLScriptSegment | undefined {
        const query = this.getExecutingQuery(false);

        if (!query) {
          return undefined;
        }

        query.query = query.query.trim();

        return query;
      },
      setModeId(tabId: string): void {
        this.state.currentModeId = tabId;
        this.onUpdate.execute();
      },
    }),
    {
      getHintProposals: action.bound,
      formatScript: action.bound,
      executeQuery: action.bound,
      executeQueryNewTab: action.bound,
      showExecutionPlan: action.bound,
      executeScript: action.bound,
      switchEditing: action.bound,
      dialect: computed,
      isDisabled: computed,
      value: computed,
      readonly: computed,
      cursor: computed,
      activeSegmentMode: observable.ref,
      hintsLimitIsMet: observable.ref,
      readonlyState: observable,
      executingScript: observable,
    },
    {
      state,
      connectionExecutionContextService,
      sqlQueryService,
      sqlDialectInfoService,
      sqlEditorService,
      sqlExecutionPlanService,
      sqlResultTabsService,
      notificationService,
      commonDialogService,
    },
  );

  untracked(() => data.init());

  useExecutor({
    executor: data.dataSource?.onSetScript,
    handlers: [
      function setScript({ script }) {
        // ensure that cursor is in script boundaries
        data.setCursor(data.cursor.anchor, data.cursor.head);
        data.parser.setScript(script);
        data.updateParserScriptsDebounced().catch(() => {});
        data.onUpdate.execute();
      },
    ],
  });

  useExecutor({
    executor: data.dataSource?.onDatabaseModelUpdate,
    handlers: [
      function updateDatabaseModels() {
        data.loadDatabaseDataModels();
      },
    ],
  });

  useExecutor({
    executor: data.onUpdate,
    handlers: [
      function updateActiveSegmentMode() {
        // Probably we need to rework this logic
        // we want to track active segment mode with mobx
        // right now it's leads to bag when script changed from empty to not empty
        // data.isLineScriptEmpty skips this change
        const contexts = data.onMode.execute(data);
        data.activeSegmentMode = contexts.getContext(SQLEditorModeContext);
      },
    ],
  });

  useEffect(() => {
    const subscription = autorun(() => {
      const contexts = data.onMode.execute(data);
      const activeSegmentMode = contexts.getContext(SQLEditorModeContext);

      runInAction(() => {
        data.activeSegmentMode = activeSegmentMode;
      });
    });

    return subscription;
  }, [data]);

  useEffect(() => () => data.destruct(), []);

  return data;
}
