/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DatabaseDataModel } from '../DatabaseDataModel/DatabaseDataModel';
import type { IDatabaseDataOptions } from '../DatabaseDataModel/IDatabaseDataOptions';
import type { IDatabaseDataResult } from '../DatabaseDataModel/IDatabaseDataResult';
import type { DatabaseDataAccessMode, IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource';

const fetchingSettings = {
  fetchMin: 100,
  fetchMax: 5000,
  fetchDefault: 200,
};

export class DataModelWrapper extends DatabaseDataModel<IDatabaseDataOptions, IDatabaseDataResult> {
  constructor(
    source: IDatabaseDataSource<any>
  ) {
    super(source);

    this.countGain = this.getDefaultRowsCount();
  }

  isLoading(): boolean {
    return this.source.isLoading();
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
    return this;
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.source.setAccess(access);
    return this;
  }

  setOptions(options: any): this {
    this.source.setOptions(options);
    return this;
  }

  async requestData(): Promise<void> {
    await this.source.requestData();
  }

  async requestDataPortion(offset: number, count: number): Promise<void> {
    if (!this.isDataAvailable(offset, count)) {
      this.source.setSlice(offset, count);
      await this.source.requestData();
    }
  }

  async dispose(): Promise<void> {
    await this.source.dispose();
  }

  private getDefaultRowsCount(count?: number) {
    return count !== undefined
      ? Math.max(
        fetchingSettings.fetchMin,
        Math.min(count, fetchingSettings.fetchMax)
      )
      : fetchingSettings.fetchDefault;
  }
}
