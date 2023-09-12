/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, autorun, computed, IReactionDisposer, observable, untracked } from 'mobx';
import { useEffect } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlCompletionProposal, SqlDialectInfo, SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';
import { createLastPromiseGetter, LastPromiseGetter, throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures';
import type { ISqlDataSource } from '../SqlDataSource/ISqlDataSource';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorService } from '../SqlEditorService';
import { ISQLScriptSegment, SQLParser } from '../SQLParser';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService';
import { OutputLogsService } from '../SqlResultTabs/OutputLogs/OutputLogsService';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService';
import { SqlResultTabsService } from '../SqlResultTabs/SqlResultTabsService';
import type { ICursor, ISQLEditorData } from './ISQLEditorData';
import { ISQLEditorMode, SQLEditorModeContext } from './SQLEditorModeContext';

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

  cursor: ICursor;
  readonlyState: boolean;
  executingScript: boolean;
  state: ISqlEditorTabState;
  reactionDisposer: IReactionDisposer | null;
  hintsLimitIsMet: boolean;
  updateParserScripts(): Promise<void>;
  loadDatabaseDataModels(): Promise<void>;
  getExecutingQuery(script: boolean): ISQLScriptSegment | undefined;
  getResolvedSegment(): Promise<ISQLScriptSegment | undefined>;
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
  const sqlOutputLogsService = useService(OutputLogsService);

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

      get activeSegmentMode(): ISQLEditorMode {
        const contexts = this.onMode.execute(this);
        const mode = contexts.getContext(SQLEditorModeContext);

        return mode;
      },

      get activeSegment(): ISQLScriptSegment | undefined {
        return this.activeSegmentMode.activeSegment;
      },

      get cursorSegment(): ISQLScriptSegment | undefined {
        return this.parser.getSegment(this.cursor.begin, -1);
      },

      get readonly(): boolean {
        return this.executingScript || this.readonlyState || !!this.dataSource?.isOutdated() || !!this.dataSource?.isReadonly() || !this.editing;
      },

      get editing(): boolean {
        return this.dataSource?.isEditing() ?? false;
      },

      get isLineScriptEmpty(): boolean {
        return !this.activeSegment?.query;
      },

      get isScriptEmpty(): boolean {
        return this.value === '' || this.parser.scripts.length === 0;
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
      onFormat: new SyncExecutor(),
      parser: new SQLParser(),

      cursor: { begin: 0, end: 0 },
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
                    await this.updateParserScriptsThrottle();
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
        this.cursor = {
          begin,
          end,
        };
        this.onUpdate.execute();
      },

      getLastAutocomplete: createLastPromiseGetter(),
      parseScript: createLastPromiseGetter(),

      getHintProposals: throttleAsync(async function getHintProposals(this: ISQLEditorDataPrivate, position, simple) {
        const executionContext = this.dataSource?.executionContext;
        if (!executionContext) {
          return [];
        }

        const hints = await this.sqlEditorService.getAutocomplete(
          executionContext.connectionId,
          executionContext.id,
          this.value,
          position,
          MAX_HINTS_LIMIT,
          simple,
        );

        this.hintsLimitIsMet = hints.length >= MAX_HINTS_LIMIT;

        return hints;
      }, 1000 / 3),

      async formatScript(): Promise<void> {
        if (this.isDisabled || this.isScriptEmpty || !this.dataSource?.executionContext) {
          return;
        }

        const query = this.value;
        const script = this.getExecutingQuery(false);

        if (!script) {
          return;
        }

        this.onExecute.execute(true);
        try {
          this.readonlyState = true;
          const formatted = await this.sqlDialectInfoService.formatScript(this.dataSource.executionContext, script.query);

          this.onFormat.execute([script, formatted]);
          this.setQuery(query.substring(0, script.begin) + formatted + query.substring(script.end));
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
          async () => {
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

        const query = this.getSubQuery();

        try {
          await this.executeQueryAction(await this.executeQueryAction(query, () => this.getResolvedSegment()), query =>
            this.sqlExecutionPlanService.executeExecutionPlan(this.state, query.query),
          );
        } catch {}
      },

      async showOutputLogs(): Promise<void> {
        sqlOutputLogsService.showOutputLogs(this.state);
      },

      async switchEditing(): Promise<void> {
        this.dataSource?.setEditing(!this.dataSource.isEditing());
      },

      async executeScript(): Promise<void> {
        const isExecutable = this.dataSource?.hasFeature(ESqlDataSourceFeatures.executable);

        if (!isExecutable || this.isDisabled || this.isScriptEmpty) {
          return;
        }

        if (this.state.tabs.length) {
          const result = await this.commonDialogService.open(ConfirmationDialog, {
            title: 'sql_editor_close_result_tabs_dialog_title',
            message: `Do you want to close ${this.state.tabs.length} tabs before executing script?`,
            confirmActionText: 'ui_yes',
            extraStatus: 'no',
          });

          if (result === DialogueStateResult.Resolved) {
            const state = await this.sqlResultTabsService.canCloseResultTabs(this.state);

            if (!state) {
              return;
            }

            this.sqlResultTabsService.removeResultTabs(this.state);
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
                const segment = queries[index];
                this.onSegmentExecute.execute({ segment, type: 'start' });
              },
              onQueryExecuted: (query, index, success) => {
                const segment = queries[index];
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

      setQuery(query: string): void {
        this.sqlEditorService.setQuery(query, this.state);
        this.updateParserScriptsThrottle().catch(() => {});
      },

      updateParserScriptsThrottle: throttleAsync(async function updateParserScriptsThrottle() {
        await data.updateParserScripts();
      }, 1000 / 2),

      async updateParserScripts() {
        if (!this.dataSource?.hasFeature(ESqlDataSourceFeatures.script)) {
          return;
        }
        const connectionId = this.dataSource.executionContext?.connectionId;
        const script = this.parser.actualScript;

        if (!connectionId || !script) {
          return;
        }

        const { queries } = await this.parseScript([connectionId, script], async () => {
          try {
            return await this.sqlEditorService.parseSQLScript(connectionId, script);
          } catch (exception: any) {
            this.notificationService.logException(exception, 'Failed to parse SQL script');
            throw exception;
          }
        });

        if (this.parser.actualScript === script) {
          this.parser.setQueries(queries);
        }
      },

      async executeQueryAction<T>(
        segment: ISQLScriptSegment | undefined,
        action: (query: ISQLScriptSegment) => Promise<T>,
        passEmpty?: boolean,
        passDisabled?: boolean,
      ): Promise<T | undefined> {
        if (!segment || (this.isDisabled && !passDisabled) || (!passEmpty && this.isLineScriptEmpty)) {
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
        const connectionId = this.dataSource?.executionContext?.connectionId;

        if (!connectionId || this.cursor.begin !== this.cursor.end) {
          return this.getSubQuery();
        }

        if (this.activeSegmentMode.activeSegmentMode) {
          return this.activeSegment;
        }

        const result = await this.sqlEditorService.parseSQLQuery(connectionId, this.value, this.cursor.begin);

        const segment = this.parser.getSegment(result.start, result.end);

        if (!segment) {
          throw new Error('Failed to get position');
        }

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
    }),
    {
      formatScript: action.bound,
      executeQuery: action.bound,
      executeQueryNewTab: action.bound,
      showExecutionPlan: action.bound,
      showOutputLogs: action.bound,
      executeScript: action.bound,
      switchEditing: action.bound,
      dialect: computed,
      isLineScriptEmpty: computed,
      isDisabled: computed,
      value: computed,
      readonly: computed,
      hintsLimitIsMet: observable.ref,
      cursor: observable,
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
        data.parser.setScript(script);
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

  useEffect(() => () => data.destruct(), []);

  return data;
}
