/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { GQLError } from '@cloudbeaver/core-sdk';

import type { IDataContainerOptions } from '../ContainerDataSource';
import { DatabaseDataModel } from '../DatabaseDataModel/DatabaseDataModel';
import type { DatabaseDataAccessMode } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';
import type { IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource';
import type { RowDiff } from './TableDataModel/EditedRow';
import { IRequestDataResult, TableViewerModel } from './TableViewerModel';

const fetchingSettings = {
  fetchMin: 100,
  fetchMax: 5000,
  fetchDefault: 200,
};

export class DataModelWrapper extends DatabaseDataModel<IDataContainerOptions, IDatabaseDataResult> {
  /**
   * @deprecated Use getModel instead
   */
  deprecatedModels: TableViewerModel[];

  /**
   * @deprecated will be refactored
   */
  get message(): string {
    return this.errorMessage;
  }

  /**
   * @deprecated will be refactored
   */
  get details(): boolean {
    return this.hasDetails;
  }

  private errorMessage: string;
  private exception: Error | null;
  private hasDetails: boolean;

  constructor(
    private commonDialogService: CommonDialogService,
    source: IDatabaseDataSource<any>
  ) {
    super(source);

    makeObservable<DataModelWrapper, 'errorMessage' | 'exception' | 'hasDetails'>(this, {
      deprecatedModels: observable,
      errorMessage: observable,
      exception: observable,
      hasDetails: observable,
    });

    this.countGain = this.getDefaultRowsCount();
    this.exception = null;
    this.errorMessage = '';
    this.hasDetails = false;
    this.deprecatedModels = [];
  }

  isLoading(): boolean {
    return this.source.isLoading();
  }

  /**
   * @deprecated will be removed
   */
  getOldModel(resultIndex: number): TableViewerModel | null {
    return this.deprecatedModels[resultIndex] || null;
  }

  async reload(): Promise<void> {
    this.setSlice(0, this.countGain);
    await this.requestData();
  }

  async refresh(): Promise<void> {
    await this.requestData();
  }

  setCountGain(count?: number): this {
    const realCount = this.getDefaultRowsCount(count);
    this.countGain = realCount;

    for (const model of this.deprecatedModels) {
      model.setChunkSize(realCount);
    }
    return this;
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.access = access;

    for (const model of this.deprecatedModels) {
      model.access = access;
    }
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
      await this.setDeprecatedModelData();
    } catch (exception) {
      this.showError(exception);
      throw exception;
    }
  }

  async requestDataPortion(offset: number, count: number): Promise<void> {
    if (!this.isDataAvailable(offset, count)) {
      this.source.setSlice(offset, count);
      this.results = await this.source.requestData(this.results);
      await this.setDeprecatedModelData();
    }
  }

  showDetails = (): void => {
    if (this.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.exception);
    }
  };

  async dispose(): Promise<void> {
    await this.source.dispose();
  }

  /**
   * @deprecated will be removed
   */
  private async setDeprecatedModelData() {
    if (this.deprecatedModels.length !== this.results.length) {
      this.deprecatedModels = this.deprecatedModels.slice(0, this.results.length);

      for (let i = this.deprecatedModels.length; i < this.results.length; i++) {
        this.deprecatedModels.push(new TableViewerModel({
          access: this.access,
          requestDataAsync: async (
            model: TableViewerModel,
            offset: number,
            count: number,
          ): Promise<IRequestDataResult> => {
            this.source.setOptions({
              ...this.source.options!,
              constraints: Array.from(model.getSortedColumns()),
            });
            this.setSlice(0, offset + count);
            await this.requestData();

            const result = this.getResult(i);

            if (!result) {
              throw new Error('Result not exists');
            }

            return {
              rows: result.data.rows!,
              columns: result.data.columns!,
              duration: this.source.requestInfo.requestDuration,
              statusMessage: this.source.requestInfo.requestMessage,
              isFullyLoaded: result.loadedFully,
            };
          },
          saveChanges: async (data: TableViewerModel, rows: RowDiff[]): Promise<IRequestDataResult> => {
            const result = this.getResult(i);

            if (!result) {
              throw new Error('It is expected that result was set after first fetch');
            }

            return await this.source.saveDataDeprecated(result.id, rows);
          },
        }, this.commonDialogService));
      }
    }

    for (let i = 0; i < this.results.length; i++) {
      const model = this.getOldModel(i)!;
      const result = this.getResult(i)!;

      model.refresh();
      model.setColumns(result.data.columns);
      model.insertRows(0, result.data.rows, !result.loadedFully);
    }
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
