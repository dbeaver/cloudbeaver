/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import type { IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataActions } from './DatabaseDataActions';
import type { IDatabaseDataAction, IDatabaseDataActionClass } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataEditor, IDatabaseDataResultEditor } from './IDatabaseDataEditor';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export abstract class DatabaseDataSource<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataSource<TOptions, TResult> {
  access: DatabaseDataAccessMode;
  dataFormat: ResultDataFormat;
  supportedDataFormats: ResultDataFormat[];
  editor: IDatabaseDataEditor<TResult> | null;
  actions: IDatabaseDataActions<TOptions, TResult>;
  results: TResult[];
  offset: number;
  count: number;
  options: TOptions | null;
  requestInfo: IRequestInfo;
  error: Error | null;
  executionContext: IConnectionExecutionContext | null;
  abstract get canCancel(): boolean;

  protected disabled: boolean;
  private activeRequest: Promise<TResult[]> | null;
  private activeSave: Promise<TResult[]> | null;
  private lastAction: () => Promise<void>;

  constructor() {
    makeObservable<DatabaseDataSource<TOptions, TResult>, 'activeRequest' | 'activeSave' | 'disabled'>(this, {
      access: observable,
      dataFormat: observable,
      supportedDataFormats: observable,
      editor: observable,
      results: observable,
      offset: observable,
      count: observable,
      options: observable,
      requestInfo: observable,
      error: observable,
      executionContext: observable,
      disabled: observable,
      activeRequest: observable,
      activeSave: observable,
    });

    this.actions = new DatabaseDataActions(this);
    this.access = DatabaseDataAccessMode.Default;
    this.results = [];
    this.editor = null;
    this.offset = 0;
    this.count = 0;
    this.options = null;
    this.disabled = false;
    this.activeRequest = null;
    this.activeSave = null;
    this.executionContext = null;
    this.dataFormat = ResultDataFormat.Resultset;
    this.supportedDataFormats = [];
    this.requestInfo = {
      requestDuration: 0,
      requestMessage: '',
      requestFilter: '',
      source: null,
    };
    this.error = null;
    this.lastAction = this.requestData.bind(this);
  }

  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    if (!this.hasResult(resultIndex)) {
      throw new Error('Result index out of range');
    }

    return this.actions.get(this.results[resultIndex], action);
  }

  abstract cancel(): Promise<void> | void;

  hasResult(resultIndex: number): boolean {
    return resultIndex < this.results.length;
  }

  getResult(index: number): TResult | null {
    if (this.results.length > index) {
      return this.results[index];
    }

    return null;
  }

  getEditor(resultIndex: number): IDatabaseDataResultEditor<TResult> {
    if (!this.editor) {
      throw new Error('Editor was not provided');
    }

    if (!this.hasResult(resultIndex)) {
      throw new Error('Result index out of range');
    }

    return this.editor.getResultEditor(this.results[resultIndex]);
  }

  setResults(results: TResult[]): this {
    this.editor?.cancelChanges();
    this.actions.updateResults(results);
    this.results = results;
    return this;
  }

  isReadonly(): boolean {
    return this.access === DatabaseDataAccessMode.Readonly || this.results.length > 1 || this.disabled;
  }

  isLoading(): boolean {
    return !!this.activeRequest || !!this.activeSave;
  }

  isDisabled(resultIndex: number): boolean {
    return !!this.activeRequest || !!this.activeSave || this.disabled;
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

    if (!this.supportedDataFormats.includes(this.dataFormat)) {
      this.dataFormat = dataFormats[0]; // set's default format based on supported list, but maybe should be moved to separate method
    }
    return this;
  }

  setExecutionContext(context: IConnectionExecutionContext | null): this {
    this.executionContext = context;
    return this;
  }

  async retry(): Promise<void> {
    await this.lastAction();
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
    this.lastAction = this.requestData.bind(this);

    try {
      const promise = this.request(this.results);

      if (promise instanceof Promise) {
        this.activeRequest = promise;
      }
      this.setResults(await promise);
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
    this.lastAction = this.saveData.bind(this);

    try {
      const promise = this.save(this.results);

      if (promise instanceof Promise) {
        this.activeSave = promise;
      }
      this.setResults(await promise);
    } finally {
      this.activeSave = null;
    }
  }

  clearError(): void {
    this.error = null;
  }

  abstract request(prevResults: TResult[]): TResult[] | Promise<TResult[]>;
  abstract save(prevResults: TResult[]): Promise<TResult[]> | TResult[];

  abstract dispose(): Promise<void>;
}
