/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { IDatabaseDataModel } from './IDatabaseDataModel';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export class DatabaseDataModel<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult>
implements IDatabaseDataModel<TOptions, TResult> {
  id: string;
  source: IDatabaseDataSource<TOptions, TResult>;
  countGain: number;

  get requestInfo(): IRequestInfo {
    return this.source.requestInfo;
  }

  get supportedDataFormats(): ResultDataFormat[] {
    return this.source.supportedDataFormats;
  }

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    makeObservable(this, {
      countGain: observable,
    });

    this.id = uuid();
    this.source = source;
    this.countGain = 0;
  }

  isLoading(): boolean {
    return this.source.isLoading();
  }

  isDisabled(resultIndex: number): boolean {
    return this.source.isDisabled(resultIndex);
  }

  isReadonly(): boolean {
    return this.source.isReadonly();
  }

  isDataAvailable(offset: number, count: number): boolean {
    return this.source.offset <= offset && this.source.count >= count;
  }

  getResult(index: number): TResult | null {
    return this.source.getResult(index);
  }

  setResults(results: TResult[]): this {
    this.source.setResults(results);
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

  setOptions(options: TOptions): this {
    this.source.setOptions(options);
    return this;
  }

  async retry(): Promise<void> {
    await this.source.retry();
  }

  async refresh(): Promise<void> {
    await this.requestData();
  }

  async reload(): Promise<void> {
    this.setSlice(0, this.countGain);
    await this.requestData();
  }

  async requestDataPortion(offset: number, count: number): Promise<void> {
    if (!this.isDataAvailable(offset, count)) {
      this.source.setSlice(offset, count);
      await this.source.requestData();
    }
  }

  async requestData(): Promise<void> {
    await this.source.requestData();
  }

  cancel(): Promise<void> | void {
    return this.source.cancel();
  }

  async dispose(): Promise<void> {
    await this.source.dispose();
  }
}
