/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLError, ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataModel } from '../DatabaseDataModel/DatabaseDataModel';
import { DatabaseDataAccessMode } from '../DatabaseDataModel/IDatabaseDataModel';
import { IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource';
import { ITableViewerModelOptions, TableViewerModel } from './TableViewerModel';

const fetchingSettings = {
  fetchMin: 1,
  fetchMax: 5000,
  fetchDefault: 200,
};

export class DataModelWrapper extends DatabaseDataModel<any> {
  /**
   * @deprecated Use getModel instead
   */
  readonly deprecatedModel: TableViewerModel;

  /**
   * @deprecated will be refactored
   */
  get message() {
    if (this.deprecatedModel.errorMessage.length > 0) {
      return this.deprecatedModel.errorMessage;
    }

    return this.errorMessage;
  }

  /**
   * @deprecated will be refactored
   */
  get details() {
    return this.deprecatedModel.hasDetails || this.hasDetails;
  }

  @observable private errorMessage: string;
  @observable private exception: Error | null;
  @observable private hasDetails: boolean;

  constructor(
    private commonDialogService: CommonDialogService,
    options: ITableViewerModelOptions,
    source: IDatabaseDataSource<any>
  ) {
    super(source);
    if (options.tableId) {
      this.id = options.tableId;
    }
    this.countGain = this.getDefaultRowsCount();
    this.exception = null;
    this.errorMessage = '';
    this.hasDetails = false;
    this.deprecatedModel = new TableViewerModel(options, commonDialogService);
  }

  isLoading(): boolean {
    return !this.deprecatedModel.noLoaderWhileRequestingDataAsync && (
      this.deprecatedModel.isLoaderVisible || this.source.isLoading()
    );
  }

  async reload(): Promise<void> {
    if (this.source.dataFormat === ResultDataFormat.Resultset) {
      await this.deprecatedModel.refresh();
    }
    this.setSlice(0, this.countGain);
    await this.requestData();
  }

  async refresh(): Promise<void> {
    if (this.source.dataFormat === ResultDataFormat.Resultset) {
      await this.deprecatedModel.refresh();
      return;
    }
    await this.requestData();
  }

  setCountGain(count: number): this {
    const realCount = this.getDefaultRowsCount(count);
    this.countGain = realCount;
    this.deprecatedModel.setChunkSize(realCount);
    return this;
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.access = access;
    this.deprecatedModel.access = access;
    return this;
  }

  setOptions(options: any): this {
    this.source.setOptions(options);
    return this;
  }

  async requestData(): Promise<void> {
    this.clearErrors();
    try {
      this.results = await this.source.requestData(this.results);
    } catch (exception) {
      this.showError(exception);
      throw exception;
    }
  }

  showDetails = (): void => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    } else {
      this.deprecatedModel.onShowDetails();
    }
  };

  async dispose(): Promise<void> {
    await this.source.dispose();
  }

  private showError(exception: any) {
    this.exception = null;
    this.hasDetails = false;
    if (exception instanceof GQLError) {
      this.errorMessage = exception.errorText;
      this.exception = exception;
      this.hasDetails = exception.hasDetails();
    } else {
      this.errorMessage = `${exception.name}: ${exception.message}`;
    }
  }

  private clearErrors() {
    this.errorMessage = '';
    this.exception = null;
  }

  private getDefaultRowsCount(count?: number) {
    return count
      ? Math.max(
        fetchingSettings.fetchMin,
        Math.min(count, fetchingSettings.fetchMax)
      )
      : fetchingSettings.fetchDefault;
  }
}
