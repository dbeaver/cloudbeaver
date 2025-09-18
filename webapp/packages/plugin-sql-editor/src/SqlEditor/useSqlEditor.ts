/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, type IReactionDisposer, observable } from 'mobx';

import { ConfirmationDialog, getComputed, useExecutor, useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { ConnectionDialectResource, ConnectionExecutionContextService, createConnectionParam } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import type { SqlCompletionProposal, SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';
import { createLastPromiseGetter, type LastPromiseGetter, throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures.js';
import type { ISqlEditorCursor } from '../SqlDataSource/ISqlDataSource.js';
import { SqlDialectInfoService } from '../SqlDialectInfoService.js';
import { SqlEditorService } from '../SqlEditorService.js';
import { type ISQLScriptSegment } from '../SQLParser.js';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService.js';
import { OUTPUT_LOGS_TAB_ID } from '../SqlResultTabs/OutputLogs/OUTPUT_LOGS_TAB_ID.js';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService.js';
import { SqlResultTabsService } from '../SqlResultTabs/SqlResultTabsService.js';
import type { ISQLEditorData } from './ISQLEditorData.js';
import { SqlEditorSettingsService } from '../SqlEditorSettingsService.js';
import { SqlEditorModelService } from '../SqlEditorModel/SqlEditorModelService.js';

interface ISQLEditorDataPrivate extends ISQLEditorData {
  readonly sqlDialectInfoService: SqlDialectInfoService;
  readonly connectionExecutionContextService: ConnectionExecutionContextService;
  readonly sqlQueryService: SqlQueryService;
  readonly sqlEditorService: SqlEditorService;
  readonly notificationService: NotificationService;
  readonly sqlExecutionPlanService: SqlExecutionPlanService;
  readonly sqlEditorSettingsService: SqlEditorSettingsService;
  readonly commonDialogService: CommonDialogService;
  readonly sqlResultTabsService: SqlResultTabsService;
  readonly getLastAutocomplete: LastPromiseGetter<SqlCompletionProposal[]>;
  readonly parseScript: LastPromiseGetter<SqlScriptInfoFragment>;

  readonlyState: boolean;
  executingScript: boolean;
  state: ISqlEditorTabState;
  reactionDisposer: IReactionDisposer | null;
  hintsLimitIsMet: boolean;
  loadDatabaseDataModels(): Promise<void>;
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
  const sqlEditorSettingsService = useService(SqlEditorSettingsService);
  const sqlEditorModelService = useService(SqlEditorModelService);

  const model = sqlEditorModelService.getOrCreate(state);

  const key = getComputed(() => {
    const executionContext = model.dataSource?.executionContext;
    if (executionContext) {
      const context = connectionExecutionContextService.get(executionContext.id)?.context;
      if (context) {
        return createConnectionParam(context.projectId, context.connectionId);
      }
    }
    return null;
  });
  const connectionDialectLoader = useResource(useSqlEditor, ConnectionDialectResource, key);

  const data = useObservableRef<ISQLEditorDataPrivate>(
    () => ({
      get readonly(): boolean {
        return this.executingScript || this.readonlyState || !!this.model.dataSource?.isReadonly() || !this.editing;
      },

      get editing(): boolean {
        return this.model.dataSource?.isEditing() ?? false;
      },

      get isScriptEmpty(): boolean {
        return this.value === '';
      },

      get isDisabled(): boolean {
        if (!this.model.dataSource?.executionContext || !this.model.dataSource.isLoaded()) {
          return true;
        }

        const context = this.connectionExecutionContextService.get(this.model.dataSource.executionContext.id);

        return context?.executing || false;
      },

      get isIncomingChanges(): boolean {
        return this.model.dataSource?.isIncomingChanges ?? false;
      },

      get value(): string {
        return this.model.dataSource?.script ?? '';
      },

      get incomingValue(): string | undefined {
        return this.model.dataSource?.incomingScript;
      },

      get isExecutionAllowed(): boolean {
        return !!this.model.dataSource?.hasFeature(ESqlDataSourceFeatures.executable) && this.sqlEditorSettingsService.scriptExecutionEnabled;
      },

      onExecute: new SyncExecutor(),
      onSegmentExecute: new SyncExecutor(),

      readonlyState: false,
      executingScript: false,
      reactionDisposer: null,
      hintsLimitIsMet: false,

      setCursor(begin: number, end = begin): void {
        this.model.dataSource?.setCursor(begin, end);
      },

      getLastAutocomplete: createLastPromiseGetter(),

      getHintProposals: throttleAsync(async function getHintProposals(this: ISQLEditorDataPrivate, position, simple) {
        const executionContext = this.model.dataSource?.executionContext;
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
        if (this.isDisabled || this.isScriptEmpty || !this.model.dataSource?.executionContext) {
          return;
        }

        const script = await this.model.getResolvedSegment();

        if (!script) {
          return;
        }

        this.onExecute.execute(true);
        try {
          this.readonlyState = true;
          const formatted = await this.sqlDialectInfoService.formatScript(this.model.dataSource.executionContext, script.query);

          const cursorAnchor = this.model.cursor.anchor;
          this.setScript(this.value.substring(0, script.begin) + formatted + this.value.substring(script.end), 'format', {
            anchor: cursorAnchor,
            head: cursorAnchor,
          });
        } finally {
          this.readonlyState = false;
        }
      },

      async executeQuery(): Promise<void> {
        const isQuery = this.model.dataSource?.hasFeature(ESqlDataSourceFeatures.query);

        if (!isQuery || !this.isExecutionAllowed) {
          return;
        }

        try {
          const segment = await this.model.getResolvedSegment();
          await this.executeQueryAction(segment, query => this.sqlQueryService.executeEditorQuery(this.state, query.query, false));
        } catch {}
      },

      async loadDatabaseDataModels(): Promise<void> {
        // force script parsing, cursorSegment depends on it
        await this.model.getResolvedSegment();
        await this.executeQueryAction(
          this.model.cursorSegment,
          () => {
            if (this.model.dataSource?.databaseModels.length) {
              this.sqlQueryService.initDatabaseDataModels(this.state);
            }
          },
          true,
          true,
        );
      },

      async executeQueryNewTab(): Promise<void> {
        const isQuery = this.model.dataSource?.hasFeature(ESqlDataSourceFeatures.query);

        if (!isQuery || !this.isExecutionAllowed) {
          return;
        }

        try {
          await this.executeQueryAction(await this.executeQueryAction(this.model.cursorSegment, () => this.model.getResolvedSegment()), query =>
            this.sqlQueryService.executeEditorQuery(this.state, query.query, true),
          );
        } catch {}
      },

      async showExecutionPlan(): Promise<void> {
        const isQuery = this.model.dataSource?.hasFeature(ESqlDataSourceFeatures.query);

        if (!isQuery || !this.isExecutionAllowed || !this.dialect?.supportsExplainExecutionPlan) {
          return;
        }

        try {
          const segment = await this.model.getResolvedSegment();
          await this.executeQueryAction(segment, query => this.sqlExecutionPlanService.executeExecutionPlan(this.state, query.query));
        } catch {}
      },

      async executeScript(): Promise<void> {
        if (!this.isExecutionAllowed || this.isDisabled || this.isScriptEmpty) {
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
          await this.model.getResolvedSegment();
          const queries = this.model.parser.scripts;

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
        this.model.dataSource?.setScript(query, source, cursor);
      },

      async executeQueryAction<T>(
        segment: ISQLScriptSegment | undefined,
        action: (query: ISQLScriptSegment) => Promise<T>,
        passEmpty?: boolean,
        passDisabled?: boolean,
      ): Promise<T | undefined> {
        if (!segment || segment.end === segment.begin || (this.isDisabled && !passDisabled) || (!passEmpty && this.isScriptEmpty)) {
          return;
        }

        this.onExecute.execute(true);

        const id = setTimeout(() => this.onSegmentExecute.execute({ segment, type: 'start' }), 250);
        try {
          const result = await action(segment);
          clearTimeout(id);
          this.onSegmentExecute.execute({ segment, type: 'end' });
          return result;
        } catch (exception: any) {
          clearTimeout(id);
          this.onSegmentExecute.execute({ segment, type: 'end' });
          this.onSegmentExecute.execute({ segment, type: 'error' });
          throw exception;
        }
      },
      setModeId(tabId: string): void {
        this.state.currentModeId = tabId;
      },
    }),
    {
      getHintProposals: action.bound,
      formatScript: action.bound,
      executeQuery: action.bound,
      executeQueryNewTab: action.bound,
      showExecutionPlan: action.bound,
      executeScript: action.bound,
      isDisabled: computed,
      value: computed,
      readonly: computed,
      state: observable.ref,
      model: observable.ref,
      dialect: observable.ref,
      hintsLimitIsMet: observable.ref,
      readonlyState: observable,
      executingScript: observable,
      sqlEditorSettingsService: observable.ref,
    },
    {
      state,
      model,
      dialect: connectionDialectLoader.tryGetData,
      connectionExecutionContextService,
      sqlQueryService,
      sqlDialectInfoService,
      sqlEditorService,
      sqlExecutionPlanService,
      sqlResultTabsService,
      notificationService,
      commonDialogService,
      sqlEditorSettingsService,
    },
  );

  useExecutor({
    executor: model.dataSource?.onDatabaseModelUpdate,
    handlers: [
      function updateDatabaseModels() {
        data.loadDatabaseDataModels();
      },
    ],
  });

  return data;
}
