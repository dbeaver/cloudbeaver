/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { IDestructibleController, IInitializableController, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import {
  GQLError, GraphQLService, ResultDataFormat, ServerInternalError
} from '@cloudbeaver/core-sdk';
import { PromiseCancelledError } from '@cloudbeaver/core-utils';
import {
  fetchingSettings,
  IRequestDataResult,
  RowDiff,
  TableViewerStorageService,
  TableViewerModel,
  DatabaseDataAccessMode,
} from '@cloudbeaver/plugin-data-viewer';

import { IResultDataTab, IQueryTabGroup } from '../../ISqlEditorTabState';
import { QueryDataSource } from '../../QueryDataSource';
import { SqlEditorGroupMetadataService } from '../../SqlEditorGroupMetadataService';
import { SqlExecutionState } from '../../SqlExecutionState';
import { SQLQueryExecutionProcess } from '../SQLQueryExecutionProcess';
import { SqlResultService } from '../SqlResultService';
import { SqlResultTabsService } from '../SqlResultTabsService';

export enum EPanelState {
  PENDING = 'PENDING',
  ERROR = 'ERROR',
  MESSAGE_RESULT = 'MESSAGE_RESULT',
  TABLE_RESULT = 'TABLE_RESULT',
}

@injectable()
export class SqlResultPanelController
implements IInitializableController, IDestructibleController {

  @observable state: EPanelState = EPanelState.PENDING;
  @observable executionResult = '';
  @observable errorMessage?: string;
  @observable hasDetails = false;

  private exception: Error | null = null;
  private panelInit!: IResultDataTab;
  private group!: IQueryTabGroup;
  private tabId!: string;
  private sqlProcess: SQLQueryExecutionProcess | null = null;

  constructor(
    private sdk: GraphQLService,
    private sqlResultService: SqlResultService,
    private tableViewerStorageService: TableViewerStorageService,
    private connectionInfoResource: ConnectionInfoResource,
    private commonDialogService: CommonDialogService,
    private notificationService: NotificationService,
    private sqlEditorGroupMetadataService: SqlEditorGroupMetadataService,
    private sqlResultTabsService: SqlResultTabsService
  ) {
  }

  async init(tabId: string, panelInit: IResultDataTab, group: IQueryTabGroup) {
    this.tabId = tabId;
    this.panelInit = panelInit;
    this.group = group;
  }

  async updateResult() {
    const sqlExecutionContext = this.sqlResultTabsService.getTabExecutionContext(this.tabId);
    const metadata = this.sqlEditorGroupMetadataService.getTabData(this.panelInit.resultTabId);
    if (this.sqlProcess === metadata.resultDataProcess) {
      return;
    }

    try {
      this.sqlProcess = metadata.resultDataProcess;
      const response = await metadata.resultDataProcess.promise;

      const dataSet = response.results![this.panelInit.indexInResultSet];

      if (!dataSet) {
        throw new Error(`dataset not found: ${this.panelInit.indexInResultSet}`);
      }

      if (!dataSet.resultSet) {
        this.state = EPanelState.MESSAGE_RESULT;
        this.executionResult = `Query executed: ${response.statusMessage || ''} (${response.duration} ms)`;
      } else {
        this.state = EPanelState.TABLE_RESULT;
        const initialState = this.sqlResultService
          .sqlExecuteInfoToData(response, this.panelInit.indexInResultSet, fetchingSettings.fetchDefault);

        const connectionInfo = await this.connectionInfoResource.load(this.group.sqlQueryParams.connectionId);

        if (this.tableViewerStorageService.has(this.getTableId())) {
          this.tableViewerStorageService.remove(this.getTableId());
        }

        const tableModel = this.tableViewerStorageService.create(
          {
            tableId: this.getTableId(),
            connectionId: this.group.sqlQueryParams.connectionId,
            executionContext: this.group.sqlQueryParams,
            resultId: dataSet.resultSet.id,
            sourceName: this.group.sqlQueryParams.query,
            access: connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default,
            requestDataAsync: this.requestDataAsync.bind(this, sqlExecutionContext),
            noLoaderWhileRequestingDataAsync: true,
            saveChanges: this.saveChanges.bind(this),
          },
          new QueryDataSource(this.sdk)
            .setOptions({
              connectionId: this.group.sqlQueryParams.connectionId,
              sourceName: this.group.sqlQueryParams.query,
              constraints: [],
              whereFilter: '',
              dataFormat: ResultDataFormat.Resultset,
            })
        )
          .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default)
          .deprecatedModel;

        tableModel.insertRows(0, initialState.rows, !initialState.isFullyLoaded);
        tableModel.setColumns(initialState.columns);
        tableModel.updateInfo(initialState.statusMessage, initialState.duration);
      }

    } catch (exception) {
      if (exception instanceof PromiseCancelledError) {
        this.state = EPanelState.MESSAGE_RESULT;
        this.executionResult = 'Query execution cancelled';
        return;
      }

      this.state = EPanelState.ERROR;
      this.exception = null;
      this.hasDetails = false;

      if (exception instanceof ServerInternalError) {
        this.errorMessage = exception.message;
        this.exception = exception;
        this.hasDetails = !!exception.stackTrace;
      }
      else if (exception instanceof GQLError) {
        this.errorMessage = exception.errorText;
        this.exception = exception;
        this.hasDetails = exception.hasDetails();
      } else {
        this.notificationService.logException(exception, 'Error while processing SQL query result');
        this.errorMessage = exception.message;
      }
    }
  }

  getQuery(): string {
    return this.group.sqlQueryParams.query;
  }

  destruct() {
    if (this.state === EPanelState.TABLE_RESULT) {
      this.tableViewerStorageService.remove(this.getTableId());
    }
  }

  getTableId() {
    return this.panelInit.resultTabId;
  }

  onShowDetails = () => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  }

  private async requestDataAsync(
    sqlExecutingState: SqlExecutionState,
    model: TableViewerModel,
    offset: number,
    count: number
  ): Promise<IRequestDataResult> {
    const metadata = this.sqlEditorGroupMetadataService.getTabData(this.panelInit.resultTabId);

    metadata.start(
      sqlExecutingState,
      this.group.sqlQueryParams,
      {
        offset,
        limit: count,
        constraints: Array.from(model.getSortedColumns()),
        where: model.getQueryWhereFilter() || undefined,
      }
    );

    this.sqlProcess = metadata.resultDataProcess;
    const response = await metadata.resultDataProcess.promise;
    const dataResults = this.sqlResultService.sqlExecuteInfoToData(
      response,
      this.panelInit.indexInResultSet,
      count
    );

    // /**
    //  * Note that each data fetching overwrites resultId
    //  */
    const dataSet = response.results![this.panelInit.indexInResultSet]!.resultSet!;
    await this.updateTableInfo(model, dataSet.id);
    return dataResults;
  }

  private async updateTableInfo(model: TableViewerModel, resultId: string) {
    const connectionInfo = await this.connectionInfoResource.load(this.group.sqlQueryParams.connectionId);

    model.resultId = resultId;
    model.access = connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default;
    model.sourceName = this.group.sqlQueryParams.query;
    model.executionContext = this.group.sqlQueryParams;
    model.connectionId = this.group.sqlQueryParams.connectionId;
  }

  async saveChanges(model: TableViewerModel, diffs: RowDiff[]): Promise<IRequestDataResult> {
    if (!model.resultId) {
      throw new Error('resultId must be provided before saving changes');
    }

    const response = await this.sqlResultService.saveChanges(this.group.sqlQueryParams, model.resultId, diffs);

    return this.sqlResultService.sqlExecuteInfoToData(response, this.panelInit.indexInResultSet);
  }

}
