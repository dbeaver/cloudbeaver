import { CommonDialogService } from '@cloudbeaver/core-dialogs';
/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DatabaseDataModel } from '../DatabaseDataModel/DatabaseDataModel';
import { DatabaseDataAccessMode } from '../DatabaseDataModel/IDatabaseDataModel';
import { IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource';
import { ITableViewerModelOptions, TableViewerModel } from './TableViewerModel';

export class DataModelWrapper extends DatabaseDataModel<any, any> {
  /**
   * @deprecated Use getModel instead
   */
  readonly deprecatedModel: TableViewerModel;

  constructor(
    commonDialogService: CommonDialogService,
    options: ITableViewerModelOptions,
    source: IDatabaseDataSource<any, any>
  ) {
    super(source);
    if (options.tableId) {
      this.id = options.tableId;
    }
    this.deprecatedModel = new TableViewerModel(options, commonDialogService);
  }

  isLoading(): boolean {
    return this.deprecatedModel.isLoaderVisible || this.source.isLoading();
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.access = access;
    this.deprecatedModel.access = access;
    return this;
  }

  setSlice(offset: number, count: number): this {
    this.source.setSlice(offset, count);
    this.deprecatedModel.setChunkSize(count);
    return this;
  }

  setOptions(options: any): this {
    this.source.setOptions(options);
    return this;
  }

  async requestData(): Promise<void> {
    this.results = await this.source.requestData(this.results);
  }
}
