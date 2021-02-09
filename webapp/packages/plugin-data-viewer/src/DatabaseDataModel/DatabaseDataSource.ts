/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IExecutionContext } from '../IExecutionContext';
import type { RowDiff } from '../TableViewer/TableDataModel/EditedRow';
import type { IRequestDataResult } from '../TableViewer/TableViewerModel';
import type { IDatabaseDataEditor, IDatabaseDataResultEditor } from './IDatabaseDataEditor';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export abstract class DatabaseDataSource<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataSource<TOptions, TResult> {
  access: DatabaseDataAccessMode;
  dataFormat: ResultDataFormat;
  supportedDataFormats: ResultDataFormat[];
  editor: IDatabaseDataEditor<TResult> | null;
  results: TResult[];
  offset: number;
  count: number;
  options: TOptions | null;
  requestInfo: IRequestInfo;
  executionContext: IExecutionContext | null;
  abstract get canCancel(): boolean;

  private activeRequest: Promise<TResult[]> | null;
  private activeSave: Promise<TResult[]> | null;

  constructor() {
    makeObservable<DatabaseDataSource<TOptions, TResult>, 'activeRequest' | 'activeSave'>(this, {
      access: observable,
      dataFormat: observable,
      supportedDataFormats: observable,
      editor: observable,
      results: observable,
      offset: observable,
      count: observable,
      options: observable,
      requestInfo: observable,
      executionContext: observable,
      activeRequest: observable,
      activeSave: observable,
    });

    this.access = DatabaseDataAccessMode.Default;
    this.results = [];
    this.editor = null;
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

  getResult(index: number): TResult | null {
    if (this.results.length > index) {
      return this.results[index];
    }

    return null;
  }

  getEditor(resultIndex: number): IDatabaseDataResultEditor {
    if (!this.editor) {
      throw new Error('Editor was not provided');
    }

    return this.editor.getResultEditor(this.results[resultIndex]);
  }

  setResults(results: TResult[]): this {
    this.editor?.cancelChanges();
    this.results = results;
    return this;
  }

  isLoading(): boolean {
    return !!this.activeRequest || !!this.activeSave;
  }

  setEditor(editor: IDatabaseDataEditor<TResult>): this {
    this.editor = editor;
    return this;
  }

  setAccess(access: DatabaseDataAccessMode): this {
    this.access = access;
    return this;
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

  async requestData(): Promise<void> {
    if (this.activeSave) {
      try {
        await this.activeSave;
      } finally { }
    }

    if (this.activeRequest) {
      await this.activeRequest;
      return;
    }

    try {
      const promise = this.request(this.results);

      if (promise instanceof Promise) {
        this.activeRequest = promise;
      }
      this.editor?.cancelChanges();
      this.results = await promise;
    } finally {
      this.activeRequest = null;
    }
  }

  async saveData(): Promise<void> {
    if (this.activeRequest) {
      try {
        await this.activeRequest;
      } finally { }
    }

    if (this.activeSave) {
      await this.activeSave;
      return;
    }

    try {
      const promise = this.save(this.results);

      if (promise instanceof Promise) {
        this.activeSave = promise;
      }
      this.results = await promise;
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
  abstract save(prevResults: TResult[]): Promise<TResult[]> | TResult[];
  abstract saveDeprecated(resultId: string, rows: RowDiff[]): Promise<IRequestDataResult>;

  abstract dispose(): Promise<void>;
}
