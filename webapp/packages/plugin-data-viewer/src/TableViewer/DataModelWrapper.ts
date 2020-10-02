/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { CommonDialogService } from '@cloudbeaver/core-dialogs';

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

  constructor(
    commonDialogService: CommonDialogService,
    options: ITableViewerModelOptions,
    source: IDatabaseDataSource<any>
  ) {
    super(source);
    if (options.tableId) {
      this.id = options.tableId;
    }
    this.countGain = this.getDefaultRowsCount();
    this.deprecatedModel = new TableViewerModel(options, commonDialogService);
  }

  isLoading(): boolean {
    return this.deprecatedModel.isLoaderVisible || this.source.isLoading();
  }

  async refresh(): Promise<void> {
    await this.deprecatedModel.refresh();
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
    this.results = await this.source.requestData(this.results);
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
