/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, autorun, IReactionDisposer, action, untracked } from 'mobx';
import { useEffect } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlCompletionProposal, SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { createLastPromiseGetter, LastPromiseGetter, isObjectsEqual, throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import type { ISqlDataSource } from '../SqlDataSource/ISqlDataSource';
import { SqlDataSourceService } from '../SqlDataSource/SqlDataSourceService';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorService } from '../SqlEditorService';
import { ISQLScriptSegment, SQLParser } from '../SQLParser';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService';
import { SqlResultTabsService } from '../SqlResultTabs/SqlResultTabsService';
import type { ICursor, ISQLEditorData } from './ISQLEditorData';
import { ISQLEditorMode, SQLEditorModeContext } from './SQLEditorModeContext';

interface ISQLEditorDataPrivate extends ISQLEditorData {
  readonly sqlDialectInfoService: SqlDialectInfoService;
  readonly connectionExecutionContextService: ConnectionExecutionContextService;
  readonly sqlQueryService: SqlQueryService;
  readonly sqlEditorService: SqlEditorService;
  readonly sqlExecutionPlanService: SqlExecutionPlanService;
  readonly commonDialogService: CommonDialogService;
  readonly sqlResultTabsService: SqlResultTabsService;
  readonly dataSource: ISqlDataSource | undefined;
  readonly getLastAutocomplete: LastPromiseGetter<SqlCompletionProposal[]>;

  cursor: ICursor;
  readonlyState: boolean;
  executingScript: boolean;
  state: ISqlEditorTabState;
  reactionDisposer: IReactionDisposer | null;
  hintsLimitIsMet: boolean;
  updateParserScripts(): Promise<void>;
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
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const sqlResultTabsService = useService(SqlResultTabsService);
  const commonDialogService = useService(CommonDialogService);
  const sqlDataSourceService = useService(SqlDataSourceService);

  const data = useObservableRef<ISQLEditorDataPrivate>(() => ({
    get dataSource(): ISqlDataSource | undefined {
      return sqlDataSourceService.get(this.state.editorId);
    },
    get dialect(): SqlDialectInfo | undefined {
      if (!this.dataSource?.executionContext) {
        return undefined;
      }

      return this.sqlDialectInfoService.getDialectInfo(createConnectionParam(
        this.dataSource.executionContext.projectId,
        this.dataSource.executionContext.connectionId
      ));
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
      return (
        this.executingScript
        || this.readonlyState
        || !!this.dataSource?.isOutdated()
        || !!this.dataSource?.isReadonly()
        || !this.editing
      );
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
      if (
        !this.dataSource?.executionContext
        || !this.dataSource.isLoaded()
      ) {
        return true;
      }

      const context = this.connectionExecutionContextService.get(this.dataSource.executionContext.id);

      return context?.executing || false;
    },

    get value(): string {
      return this.dataSource?.script ?? '';
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

      this.parser.setCustomDelimiters(['\n\n']);
      this.parser.setScript(this.value);

      this.reactionDisposer = autorun(() => {
        if (this.dataSource?.executionContext) {
          const context = this.connectionExecutionContextService.get(this.dataSource.executionContext.id);

          if (context) {
            const key = createConnectionParam(
              this.dataSource.executionContext.projectId,
              this.dataSource.executionContext.connectionId
            );

            untracked(() => {
              this.sqlDialectInfoService
                .loadSqlDialectInfo(key)
                .then(async dialect => {
                  this.parser.setDialect(dialect || null);
                  await this.updateParserScriptsThrottle();
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

    getHintProposals: throttleAsync(async function getHintProposals(
      this: ISQLEditorDataPrivate,
      position,
      word,
      simple
    ) {
      if (!this.dataSource?.executionContext) {
        return [];
      }

      const hintsGetter = () => this.sqlEditorService.getAutocomplete(
        connectionId, id, this.value, position, MAX_HINTS_LIMIT, simple
      );

      const { connectionId, id, defaultSchema, defaultCatalog } = this.dataSource.executionContext;
      const key = [connectionId, id, defaultSchema, defaultCatalog, position, simple, word.slice(0, 1)];

      const hints = await this.getLastAutocomplete(key, hintsGetter);

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
        this.setQuery(
          query.substring(0, script.begin)
          + formatted
          + query.substring(script.end)
        );
      } finally {
        this.readonlyState = false;
      }
    },

    async executeQuery(): Promise<void> {
      const query = this.getSubQuery();

      await this.executeQueryAction(
        await this.executeQueryAction(query, () => this.getResolvedSegment()),
        query => this.sqlQueryService.executeEditorQuery(
          this.state,
          query.query,
          false
        )
      );
    },

    async executeQueryNewTab(): Promise<void> {
      const query = this.getSubQuery();

      await this.executeQueryAction(
        await this.executeQueryAction(query, () => this.getResolvedSegment()),
        query => this.sqlQueryService.executeEditorQuery(
          this.state,
          query.query,
          true
        )
      );
    },

    async showExecutionPlan(): Promise<void> {
      if (!this.dialect?.supportsExplainExecutionPlan) {
        return;
      }

      const query = this.getSubQuery();

      await this.executeQueryAction(
        await this.executeQueryAction(query, () => this.getResolvedSegment()),
        query => this.sqlExecutionPlanService.executeExecutionPlan(
          this.state,
          query.query,
        )
      );
    },

    async switchEditing(): Promise<void> {
      this.dataSource?.setEditing(!this.dataSource.isEditing());
    },

    async executeScript(): Promise<void> {
      if (this.isDisabled || this.isScriptEmpty) {
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
          }
        );
      } finally {
        this.executingScript = false;
      }
    },

    setQuery(query: string): void {
      this.sqlEditorService.setQuery(query, this.state);
    },

    updateParserScriptsThrottle: throttleAsync(async function updateParserScriptsThrottle() {
      await data.updateParserScripts();
    }, 1000 / 2),

    async updateParserScripts() {
      const connectionId = this.dataSource?.executionContext?.connectionId;
      const script = this.parser.actualScript;

      if (!connectionId || !script) {
        return;
      }

      const { queries } = await this.sqlEditorService
        .parseSQLScript(
          connectionId,
          script
        );

      if (this.parser.actualScript === script) {
        this.parser.setQueries(queries);
      }
    },

    async executeQueryAction<T>(
      segment: ISQLScriptSegment | undefined,
      action: (query: ISQLScriptSegment) => Promise<T>,
      passEmpty?: boolean,
      passDisabled?: boolean
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


      const result = await this.sqlEditorService.parseSQLQuery(
        connectionId,
        this.value,
        this.cursor.begin
      );

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

      // TODO: should be moved to SQLParser
      if (this.dialect?.scriptDelimiter && query.query.endsWith(this.dialect.scriptDelimiter)) {
        query.query = query.query.slice(0, query.query.length - this.dialect.scriptDelimiter.length);
      }

      query.query = query.query.trim();

      return query;
    },
  }), {
    formatScript: action.bound,
    executeQuery: action.bound,
    executeQueryNewTab: action.bound,
    showExecutionPlan: action.bound,
    executeScript: action.bound,
    switchEditing: action.bound,
    activeSegmentMode: computed({
      equals: isObjectsEqual,
    }),
    dialect: computed,
    activeSegment: computed,
    isLineScriptEmpty: computed,
    isDisabled: computed,
    value: computed,
    readonly: computed,
    hintsLimitIsMet: observable.ref,
    cursor: observable,
    readonlyState: observable,
    executingScript: observable,
  }, {
    state,
    connectionExecutionContextService,
    sqlQueryService,
    sqlDialectInfoService,
    sqlEditorService,
    sqlExecutionPlanService,
    sqlResultTabsService,
    commonDialogService,
  });

  untracked(() => data.init());

  useExecutor({
    executor: data.dataSource?.onSetScript,
    handlers: [function setScript(script) {
      data.parser.setScript(script);
      data.onUpdate.execute();
    }],
  });

  useEffect(() => () => data.destruct(), []);

  return data;
}
