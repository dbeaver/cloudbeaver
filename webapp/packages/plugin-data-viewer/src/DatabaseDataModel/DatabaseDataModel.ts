/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Executor, ExecutorInterrupter, type IExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { IDatabaseDataModel, IRequestEventData } from './IDatabaseDataModel.js';
import type { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource.js';

export class DatabaseDataModel<TSource extends IDatabaseDataSource<any, any> = IDatabaseDataSource> implements IDatabaseDataModel<TSource> {
  id: string;
  name: string | null;
  source: TSource;
  countGain: number;

  get requestInfo(): IRequestInfo {
    return this.source.requestInfo;
  }

  get supportedDataFormats(): ResultDataFormat[] {
    return this.source.supportedDataFormats;
  }

  readonly onDispose: IExecutor;
  readonly onOptionsChange: IExecutor;
  readonly onRequest: IExecutor<IRequestEventData<TSource>>;

  constructor(source: TSource) {
    this.id = uuid();
    this.name = null;
    this.source = source;
    this.countGain = 0;
    this.onDispose = new Executor();
    this.onOptionsChange = new Executor();
    this.onRequest = new Executor();
    this.source.onOperation.next(this.onRequest, data => ({ ...data, model: this }));

    makeObservable(this, {
      countGain: observable,
    });
  }

  isLoading(): boolean {
    return this.source.isLoading();
  }

  isDisabled(resultIndex?: number): boolean {
    return this.source.isDisabled(resultIndex);
  }

  isReadonly(resultIndex: number): boolean {
    return this.source.isReadonly(resultIndex);
  }

  hasElementIdentifier(resultIndex: number): boolean {
    return this.source.hasElementIdentifier(resultIndex);
  }

  isDataAvailable(offset: number, count: number): boolean {
    return this.source.isDataAvailable(offset, count);
  }

  setName(name: string | null) {
    this.name = name;
    return this;
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.source.setAccess(access);
    return this;
  }

  setCountGain(count: number): this {
    this.countGain = count;
    return this;
  }

  setSlice(offset: number, count = this.countGain): this {
    this.source.setSlice(offset, count);
    return this;
  }

  setDataFormat(dataFormat: ResultDataFormat): this {
    this.source.setDataFormat(dataFormat);
    return this;
  }

  setSupportedDataFormats(dataFormats: ResultDataFormat[]): this {
    this.source.setSupportedDataFormats(dataFormats);
    return this;
  }

  async requestOptionsChange(): Promise<boolean> {
    const contexts = await this.onOptionsChange.execute();

    return !ExecutorInterrupter.isInterrupted(contexts);
  }

  async save(): Promise<void> {
    await this.source.saveData();
  }

  async retry(): Promise<void> {
    await this.source.retry();
  }

  async refresh(): Promise<void> {
    await this.source.refreshData();
  }

  async request(mutation?: () => void): Promise<void> {
    await this.source.requestData(mutation);
  }

  async reload(): Promise<void> {
    await this.request(() => {
      this.setSlice(0, this.countGain);
    });
  }

  async requestDataPortion(offset: number, count: number): Promise<void> {
    await this.source.requestDataPortion(offset, count);
  }

  async cancel(): Promise<void> {
    await this.source.cancel();
  }

  resetData(): void {
    this.source.resetData();
  }

  async dispose(): Promise<void> {
    await this.onDispose.execute();
    await this.source.dispose();
  }
}
