/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, toJS } from 'mobx';

import type { IConnectionExecutionContext } from '@cloudbeaver/core-connections';
import type { IServiceInjector } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, IExecutor, ITask, Task } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataActions } from './DatabaseDataActions';
import type { IDatabaseDataAction, IDatabaseDataActionClass, IDatabaseDataActionInterface } from './IDatabaseDataAction';
import type { IDatabaseDataActions } from './IDatabaseDataActions';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import {
  DatabaseDataAccessMode,
  DatabaseDataSourceOperation,
  IDatabaseDataSource,
  IDatabaseDataSourceOperationEvent,
  IRequestInfo,
} from './IDatabaseDataSource';

export abstract class DatabaseDataSource<TOptions, TResult extends IDatabaseDataResult> implements IDatabaseDataSource<TOptions, TResult> {
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
  totalCountRequestTask: ITask<number> | null;

  get canCancel(): boolean {
    if (this.activeOperation instanceof Task) {
      return this.activeOperation.cancellable;
    }

    return false;
  }

  get cancelled(): boolean {
    if (this.activeOperation instanceof Task) {
      return this.activeOperation.cancelled;
    }

    return false;
  }

  readonly serviceInjector: IServiceInjector;
  protected disabled: boolean;
  private lastAction: () => Promise<void>;
  private outdated: boolean;

  readonly onOperation: IExecutor<IDatabaseDataSourceOperationEvent>;
  private get activeOperation(): Promise<void> | null {
    return this.activeOperationStack[this.activeOperationStack.length - 1] ?? null;
  }
  private readonly activeOperationStack: Array<Promise<any>>;

  constructor(serviceInjector: IServiceInjector) {
    this.serviceInjector = serviceInjector;
    this.totalCountRequestTask = null;
    this.actions = new DatabaseDataActions(this);
    this.access = DatabaseDataAccessMode.Default;
    this.results = [];
    this.activeOperationStack = [];
    this.offset = 0;
    this.count = 0;
    this.prevOptions = null;
    this.options = null;
    this.disabled = false;
    this.outdated = false;
    this.constraintsAvailable = true;
    this.executionContext = null;
    this.onOperation = new Executor();
    this.dataFormat = ResultDataFormat.Resultset;
    this.supportedDataFormats = [];
    this.requestInfo = {
      originalQuery: '',
      requestDuration: 0,
      requestMessage: '',
      requestFilter: '',
      source: null,
    };
    this.error = null;
    this.lastAction = this.requestData.bind(this);

    makeObservable<DatabaseDataSource<TOptions, TResult>, 'disabled' | 'activeOperationStack' | 'outdated'>(this, {
      access: observable,
      dataFormat: observable,
      supportedDataFormats: observable,
      results: observable,
      offset: observable,
      count: observable,
      prevOptions: observable,
      options: observable,
      requestInfo: observable,
      totalCountRequestTask: observable.ref,
      error: observable.ref,
      executionContext: observable,
      disabled: observable,
      constraintsAvailable: observable.ref,
      outdated: observable.ref,
      activeOperationStack: observable.shallow,
      setResults: action,
      setSupportedDataFormats: action,
      resetData: action,
    });
  }

  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number,
    action: IDatabaseDataActionClass<TOptions, TResult, T>,
  ): T | undefined;
  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>,
  ): T | undefined;
  tryGetAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number | TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>,
  ): T | undefined {
    if (typeof resultIndex === 'number') {
      if (!this.hasResult(resultIndex)) {
        return undefined;
      }
      return this.actions.tryGet(this.results[resultIndex], action);
    }

    return this.actions.tryGet(resultIndex, action);
  }

  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(resultIndex: number, action: IDatabaseDataActionClass<TOptions, TResult, T>): T;
  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(result: TResult, action: IDatabaseDataActionClass<TOptions, TResult, T>): T;
  getAction<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number | TResult,
    action: IDatabaseDataActionClass<TOptions, TResult, T>,
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
    action: IDatabaseDataActionInterface<TOptions, TResult, T>,
  ): T | undefined;
  getActionImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    result: TResult,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>,
  ): T | undefined;
  getActionImplementation<T extends IDatabaseDataAction<TOptions, TResult>>(
    resultIndex: number | TResult,
    action: IDatabaseDataActionInterface<TOptions, TResult, T>,
  ): T | undefined {
    if (typeof resultIndex === 'number') {
      if (!this.hasResult(resultIndex)) {
        return undefined;
      }
      return this.actions.getImplementation(this.results[resultIndex], action);
    }

    return this.actions.getImplementation(resultIndex, action);
  }

  async cancel() {
    if (this.activeOperation instanceof Task) {
      await this.activeOperation.cancel();
    }
  }

  hasResult(resultIndex: number): boolean {
    return resultIndex < this.results.length;
  }

  getResult(index: number): TResult | null {
    if (this.results.length > index) {
      return this.results[index];
    }

    return null;
  }

  setOutdated(): this {
    this.outdated = true;
    return this;
  }

  setResults(results: TResult[]): this {
    results = observable(results);
    this.actions.updateResults(results);
    this.results = results;
    return this;
  }

  isOutdated(): boolean {
    return this.outdated;
  }

  isDataAvailable(offset: number, count: number): boolean {
    return this.offset <= offset && this.count >= count;
  }

  isLoadable(): boolean {
    return !this.isLoading() && !this.disabled;
  }

  isReadonly(resultIndex: number): boolean {
    return this.access === DatabaseDataAccessMode.Readonly || this.results.length > 1 || !this.executionContext?.context || this.disabled;
  }

  isLoading(): boolean {
    return !!this.activeOperation;
  }

  isDisabled(resultIndex: number): boolean {
    return (!this.getResult(resultIndex)?.data && this.error === null) || !this.executionContext?.context;
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
    this.setOutdated();
    return this;
  }

  setTotalCount(resultIndex: number, count: number): this {
    const result = this.getResult(resultIndex);

    if (result) {
      result.totalCount = count;
    }
    return this;
  }

  async retry(): Promise<void> {
    await this.lastAction();
  }

  async runOperation<T>(task: () => Promise<T>): Promise<T | null> {
    return this.tryExecuteOperation(DatabaseDataSourceOperation.Task, task);
  }

  async requestData(mutation?: () => void): Promise<void> {
    await this.tryExecuteOperation(DatabaseDataSourceOperation.Request, () => {
      this.lastAction = this.requestData.bind(this);

      mutation?.();
      return this.requestDataAction();
    });
  }

  async requestDataPortion(offset: number, count: number): Promise<void> {
    await this.tryExecuteOperation<TResult[] | void>(DatabaseDataSourceOperation.Request, () => {
      if (!this.isDataAvailable(offset, count)) {
        this.lastAction = this.requestDataPortion.bind(this, offset, count);

        this.setSlice(offset, count);
        return this.requestDataAction();
      }
      return Promise.resolve();
    });
  }

  async refreshData(): Promise<void> {
    await this.tryExecuteOperation(DatabaseDataSourceOperation.Request, () => {
      this.lastAction = this.refreshData.bind(this);

      if (this.prevOptions) {
        this.options = toJS(this.prevOptions);
      }

      return this.requestDataAction();
    });
  }

  async saveData(): Promise<void> {
    await this.tryExecuteOperation(DatabaseDataSourceOperation.Save, () => {
      this.lastAction = this.saveData.bind(this);

      return this.save(this.results).then(data => {
        this.setResults(data);
      });
    });
  }

  async canSafelyDispose(): Promise<boolean> {
    try {
      const result = await this.tryExecuteOperation(DatabaseDataSourceOperation.Request, async () => true);
      return result || false;
    } catch {
      return false;
    }
  }

  clearError(): this {
    this.error = null;
    return this;
  }

  resetData(): this {
    this.clearError();
    this.setResults([]);
    this.setOutdated();
    return this;
  }

  async dispose(keepExecutionContext = false): Promise<void> {
    await this.cancel();
    if (!keepExecutionContext) {
      await this.executionContext?.destroy();
    }
  }

  abstract request(prevResults: TResult[]): Promise<TResult[]>;
  abstract save(prevResults: TResult[]): Promise<TResult[]>;

  abstract loadTotalCount(resultIndex: number): Promise<ITask<number>>;
  abstract cancelLoadTotalCount(): Promise<ITask<number> | null>;

  private async requestDataAction(): Promise<TResult[]> {
    this.prevOptions = toJS(this.options);
    return this.request(this.results).then(data => {
      this.outdated = false;

      if (data !== null) {
        this.setResults(data);
      }
      return data;
    });
  }

  private async tryExecuteOperation<T>(type: DatabaseDataSourceOperation, operation: () => Promise<T>): Promise<T | null> {
    if (this.activeOperation && type !== DatabaseDataSourceOperation.Request) {
      await this.activeOperation;
    }

    const operationTask = this.executeOperation(type, operation);
    try {
      this.activeOperationStack.push(operationTask);
      return await operationTask;
    } finally {
      const index = this.activeOperationStack.indexOf(operationTask);
      if (index !== -1) {
        this.activeOperationStack.splice(index, 1);
      }
    }
  }

  private executeOperation<T>(type: DatabaseDataSourceOperation, operation: () => Promise<T> | T): ITask<T | null> {
    return new Task(async () => await this.onOperation.execute({ stage: 'request', operation: type })).run().then(contexts => {
      // TODO: maybe it's better to throw an exception instead, so we will not have unexpected undefined results
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        return null;
      }

      return new Task(async () => await this.onOperation.execute({ stage: 'before', operation: type }))
        .run()
        .then(contexts => {
          if (ExecutorInterrupter.isInterrupted(contexts)) {
            return null;
          }

          return operation();
        })
        .then(async result => {
          await this.onOperation.execute({ stage: 'after', operation: type });
          return result;
        });
    });
  }
}
