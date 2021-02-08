/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IExecutionContext } from '../IExecutionContext';
import type { RowDiff } from '../TableViewer/TableDataModel/EditedRow';
import type { IRequestDataResult } from '../TableViewer/TableViewerModel';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { DataUpdate, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export abstract class DatabaseDataSource<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataSource<TOptions, TResult> {
  offset: number;
  count: number;
  dataFormat: ResultDataFormat;
  options: TOptions | null;
  requestInfo: IRequestInfo;
  executionContext: IExecutionContext | null;
  supportedDataFormats: ResultDataFormat[];
  abstract get canCancel(): boolean;

  private activeRequest: Promise<TResult[]> | null;
  private activeSave: Promise<TResult[]> | null;

  constructor() {
    makeObservable<DatabaseDataSource<TOptions, TResult>, 'activeRequest' | 'activeSave'>(this, {
      offset: observable,
      count: observable,
      dataFormat: observable,
      options: observable,
      requestInfo: observable,
      executionContext: observable,
      supportedDataFormats: observable,
      activeRequest: observable,
      activeSave: observable,
    });

    this.offset = 0;
    this.count = 0;
    this.options = null;
    this.activeRequest = null;
    this.activeSave = null;
    this.executionContext = null;
    this.dataFormat = ResultDataFormat.Resultset;
    this.supportedDataFormats = [];
    this.requestInfo = {
      requestDuration: 0,
      requestMessage: '',
    };
  }

  abstract cancel(): Promise<boolean> | boolean;

  isLoading(): boolean {
    return !!this.activeRequest || !!this.activeSave;
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
    this.dataFormat = dataFormats[0]; // set's default format based on supported list, but maybe should be moved to separate method
    return this;
  }

  setExecutionContext(context: IExecutionContext | null): this {
    this.executionContext = context;
    return this;
  }

  async requestData(prevResults: TResult[]): Promise<TResult[]> {
    if (this.activeSave) {
      try {
        await this.activeSave;
      } finally { }
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
      } finally { }
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

  async saveDataDeprecated(resultId: string, rows: RowDiff[]): Promise<IRequestDataResult> {
    if (this.activeRequest) {
      try {
        await this.activeRequest;
      } finally { }
    }

    if (this.activeSave) {
      return this.activeSave as any;
    }

    try {
      const promise = this.saveDeprecated(resultId, rows);

      if (promise instanceof Promise) {
        this.activeSave = promise as any;
      }
      return await promise as any;
    } finally {
      this.activeSave = null;
    }
  }

  abstract request(prevResults: TResult[]): TResult[] | Promise<TResult[]>;
  abstract save(prevResults: TResult[], data: DataUpdate): Promise<TResult[]> | TResult[];
  abstract saveDeprecated(resultId: string, rows: RowDiff[]): Promise<IRequestDataResult>;

  abstract dispose(): Promise<void>;
}
