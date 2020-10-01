/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { IDatabaseDataResult } from './IDatabaseDataResult';
import { DataUpdate, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export abstract class DatabaseDataSource<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataSource<TOptions, TResult> {
  @observable offset: number;
  @observable count: number;
  @observable dataFormat: ResultDataFormat;
  @observable options: TOptions | null;
  @observable requestInfo: IRequestInfo;
  @observable supportedDataFormats: ResultDataFormat[];

  @observable private activeRequest: Promise<TResult[]> | null;
  @observable private activeSave: Promise<TResult[]> | null;

  constructor() {
    this.offset = 0;
    this.count = 0;
    this.options = null;
    this.activeRequest = null;
    this.activeSave = null;
    this.dataFormat = ResultDataFormat.Resultset;
    this.supportedDataFormats = [];
    this.requestInfo = {
      requestDuration: 0,
      requestMessage: '',
    };
  }

  isLoading(): boolean {
    return !!this.activeRequest;
  }

  setSlice(offset: number, count: number): this {
    this.offset = offset;
    this.count = count;
    return this;
  }

  setOptions(options: TOptions): this {
    this.options = options;
    return this;
  }

  setDataFormat(dataFormat: ResultDataFormat): this {
    this.dataFormat = dataFormat;
    return this;
  }

  setSupportedDataFormats(dataFormats: ResultDataFormat[]): this {
    this.supportedDataFormats = dataFormats;
    return this;
  }

  async requestData(prevResults: TResult[]): Promise<TResult[]> {
    if (this.activeSave) {
      try {
        await this.activeSave;
      } finally {}
    }

    if (this.activeRequest) {
      return this.activeRequest;
    }

    try {
      const promise = this.request(prevResults);

      if (promise instanceof Promise) {
        this.activeRequest = promise;
      }
      return await promise;
    } finally {
      this.activeRequest = null;
    }
  }

  async saveData(
    prevResults: TResult[],
    data: DataUpdate
  ): Promise<TResult[]> {
    if (this.activeRequest) {
      try {
        await this.activeRequest;
      } finally {}
    }

    if (this.activeSave) {
      return this.activeSave;
    }

    try {
      const promise = this.save(prevResults, data);

      if (promise instanceof Promise) {
        this.activeSave = promise;
      }
      return await promise;
    } finally {
      this.activeSave = null;
    }
  }

  abstract request(prevResults: TResult[]): TResult[] | Promise<TResult[]>;
  abstract save(prevResults: TResult[], data: DataUpdate): Promise<TResult[]> | TResult[];
}
