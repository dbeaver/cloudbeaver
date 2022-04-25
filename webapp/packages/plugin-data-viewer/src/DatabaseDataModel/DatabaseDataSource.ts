/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable, action, toJS } from 'mobx';

import type { IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { IServiceInjector } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataActions } from './DatabaseDataActions';
import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataManager } from './IDatabaseDataManager';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export abstract class DatabaseDataSource<TOptions, TResult extends IDatabaseDataResult>
implements IDatabaseDataSource<TOptions, TResult> {
  abstract readonly dataManager: IDatabaseDataManager;
  access: DatabaseDataAccessMode;
  dataFormat: ResultDataFormat;
  supportedDataFormats: ResultDataFormat[];
  constraintsAvailable: boolean;
  actions: IDatabaseDataActions<TOptions, TResult>;
  results: TResult[];
  offset: number;
  count: number;
  prevOptions: Readonly<TOptions> | null;
  options: TOptions | null;
  requestInfo: IRequestInfo;
  error: Error | null;
  executionContext: IConnectionExecutionContext | null;

  abstract get canCancel(): boolean;

  readonly serviceInjector: IServiceInjector;
  protected disabled: boolean;
  private activeRequest: Promise<TResult[] | null> | null;
  private activeSave: Promise<TResult[]> | null;
  private activeTask: Promise<any> | null;
  private lastAction: () => Promise<void>;

  constructor(serviceInjector: IServiceInjector) {
    this.serviceInjector = serviceInjector;
    this.actions = new DatabaseDataActions(this);
    this.access = DatabaseDataAccessMode.Default;
    this.results = [];
    this.offset = 0;
    this.count = 0;
    this.prevOptions = null;
    this.options = null;
    this.disabled = false;
    this.constraintsAvailable = true;
    this.activeRequest = null;
    this.activeSave = null;
    this.activeTask = null;
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

    makeObservable<DatabaseDataSource<TOptions, TResult>, 'activeRequest' | 'activeSave' | 'activeTask' | 'disabled'>(this, {
      access: observable,
      dataFormat: observable,
      supportedDataFormats: observable,
      results: observable,
      offset: observable,
      count: observable,
      prevOptions: observable,
      options: observable,
      requestInfo: observable,
      error: observable.ref,
      executionContext: observable,
      disabled: observable,
      constraintsAvailable: observable.ref,
      activeRequest: observable.ref,
      activeSave: observable.ref,
      activeTask: observable.ref,
      setResults: action,
      setSupportedDataFormats: action,
    });
  }

  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T | undefined;
  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T | undefined;
  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number | TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T | undefined {
    if (typeof resultIndex === 'number') {
      if (!this.hasResult(resultIndex)) {
        return undefined;
      }
      return this.actions.tryGet(this.results[resultIndex], action);
    }

    return this.actions.tryGet(resultIndex, action);
  }

  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T;
  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T;
  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number | TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>
  ): T {
    if (typeof resultIndex === 'number') {
      if (!this.hasResult(resultIndex)) {
        throw new Error('Result index out of range');
      }
      return this.actions.get(this.results[resultIndex], action);
    }

    return this.actions.get(resultIndex, action);
  }

  getActionImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined;
  getActionImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined;
  getActionImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number | TResult,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>
  ): T | undefined {
    if (typeof resultIndex === 'number') {
      if (!this.hasResult(resultIndex)) {
        return undefined;
      }
      return this.actions.getImplementation(this.results[resultIndex], action);
    }

    return this.actions.getImplementation(resultIndex, action);
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

  setResults(results: TResult[]): this {
    this.actions.updateResults(results);
    this.results = results;
    this.dataManager.clearCache();
    return this;
  }

  isReadonly(): boolean {
    return this.access === DatabaseDataAccessMode.Readonly
      || this.results.length > 1
      || !this.executionContext?.context
      || this.disabled;
  }

  isLoading(): boolean {
    return !!this.activeRequest || !!this.activeSave || !!this.activeTask;
  }

  isDisabled(resultIndex: number): boolean {
    return this.isLoading() || this.disabled;
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

  setConstraintsAvailable(value: boolean) {
    this.constraintsAvailable = value;
    return this;
  }

  setExecutionContext(context: IConnectionExecutionContext | null): this {
    this.executionContext = context;
    return this;
  }

  async retry(): Promise<void> {
    await this.lastAction();
  }

  async runTask<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeTask) {
      try {
        await this.activeTask;
      } catch { }
    }

    if (this.activeSave) {
      try {
        await this.activeSave;
      } catch { }
    }

    if (this.activeRequest) {
      try {
        await this.activeRequest;
      } catch { }
    }

    this.activeTask = task();

    try {
      return await this.activeTask;
    } finally {
      this.activeTask = null;
    }
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
      this.activeRequest = this.requestDataAction();

      const data = await this.activeRequest;

      if (data !== null) {
        this.setResults(data);
      }
    } finally {
      this.activeRequest = null;
    }
  }

  async refreshData(): Promise<void> {
    if (this.prevOptions) {
      this.options = toJS(this.prevOptions);
    }
    await this.requestData();
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

  resetData(): void {
    if (this.activeSave || this.activeRequest) {
      return;
    }
    this.setResults([]);
  }

  abstract request(prevResults: TResult[]): TResult[] | Promise<TResult[]>;
  abstract save(prevResults: TResult[]): Promise<TResult[]> | TResult[];

  abstract dispose(): Promise<void>;

  async requestDataAction(): Promise<TResult[] | null> {
    this.prevOptions = toJS(this.options);
    return this.request(this.results);
  }
}
