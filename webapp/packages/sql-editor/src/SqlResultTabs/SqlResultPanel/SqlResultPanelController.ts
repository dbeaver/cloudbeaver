/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ErrorDetailsDialog } from '@dbeaver/core/app';
import { IDestructibleController, IInitializableController, injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GQLError, ServerInternalError } from '@dbeaver/core/sdk';
import { PromiseCancelledError } from '@dbeaver/core/utils';
import {
  fetchingSettings,
  IRequestDataResult,
  IRequestDataResultOptions,
  RowDiff,
  TableViewerStorageService,
  TableViewerModel,
  IExecutionContext,
} from '@dbeaver/data-viewer-plugin';

import { ISqlResultPanelParams } from '../../ISqlEditorTabState';
import { SqlExecutionState } from '../../SqlExecutionState';
import { SqlResultService } from '../SqlResultService';

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
  private panelInit!: ISqlResultPanelParams;

  constructor(private sqlResultService: SqlResultService,
              private tableViewerStorageService: TableViewerStorageService,
              private commonDialogService: CommonDialogService,
              private notificationService: NotificationService) {
  }

  async init(panelInit: ISqlResultPanelParams) {
    this.panelInit = panelInit;

    try {
      const response = await this.panelInit.firstDataPortion.promise;

      const dataSet = response.results![panelInit.indexInResultSet];

      if (!dataSet) {
        throw new Error(`dataset not found: ${panelInit.indexInResultSet}`);
      }

      if (!dataSet.resultSet) {
        this.state = EPanelState.MESSAGE_RESULT;
        this.executionResult = `Query executed: ${response.statusMessage || ''} (${response.duration} ms)`;
      } else {
        this.state = EPanelState.TABLE_RESULT;
        const initialState = this.sqlResultService
          .sqlExecuteInfoToData(response, this.panelInit.indexInResultSet, fetchingSettings.fetchDefault);

        const tableModel = this.tableViewerStorageService.create({
          tableId: this.getTableId(),
          connectionId: panelInit.sqlQueryParams.connectionId,
          executionContext: panelInit.sqlQueryParams,
          resultId: dataSet.resultSet.id,
          sourceName: panelInit.sqlQueryParams.query,
          requestDataAsync: this.requestDataAsync.bind(this, panelInit.sqlExecutionState),
          noLoaderWhileRequestingDataAsync: true,
          saveChanges: this.saveChanges.bind(this),
        });

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
    return this.panelInit.sqlQueryParams.query;
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
    rowOffset: number,
    count: number,
    options: IRequestDataResultOptions,
  ): Promise<IRequestDataResult> {

    const queryExecutionProcess = this.sqlResultService
      .asyncSqlQuery(this.panelInit.sqlQueryParams, rowOffset, count, options);
    sqlExecutingState.setCurrentlyExecutingQuery(queryExecutionProcess);
    const response = await queryExecutionProcess.promise;
    const dataResults = this.sqlResultService.sqlExecuteInfoToData(response, this.panelInit.indexInResultSet, count);

    /**
     * Note that each data fetching overwrites resultId
     */
    const dataSet = response.results![this.panelInit.indexInResultSet]!.resultSet!;
    model.resultId = dataSet.id;
    return dataResults;
  }

  async saveChanges(model: TableViewerModel, diffs: RowDiff[]): Promise<IRequestDataResult> {
    if (!model.resultId) {
      throw new Error('resultId must be provided before saving changes');
    }

    const response = await this.sqlResultService.saveChanges(this.panelInit.sqlQueryParams, model.resultId, diffs);

    return this.sqlResultService.sqlExecuteInfoToData(response, this.panelInit.indexInResultSet);
  }

}
