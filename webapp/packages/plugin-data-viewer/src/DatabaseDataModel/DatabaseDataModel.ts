/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { Executor, ExecutorInterrupter, IExecutor } from '@cloudbeaver/core-executor';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

import type { IDatabaseDataModel, IRequestEventData } from './IDatabaseDataModel';
import type { IDatabaseDataResult } from './IDatabaseDataResult';
import type { DatabaseDataAccessMode, IDatabaseDataSource, IRequestInfo } from './IDatabaseDataSource';

export class DatabaseDataModel<TOptions, TResult extends IDatabaseDataResult = IDatabaseDataResult>
implements IDatabaseDataModel<TOptions, TResult> {
  id: string;
  name: string | null;
  source: IDatabaseDataSource<TOptions, TResult>;
  countGain: number;

  get requestInfo(): IRequestInfo {
    return this.source.requestInfo;
  }

  get supportedDataFormats(): ResultDataFormat[] {
    return this.source.supportedDataFormats;
  }

  readonly onOptionsChange: IExecutor;
  readonly onRequest: IExecutor<IRequestEventData<TOptions, TResult>>;

  private currentTask: Promise<void> | null;

  constructor(source: IDatabaseDataSource<TOptions, TResult>) {
    this.id = uuid();
    this.name = null;
    this.source = source;
    this.countGain = 0;
    this.onOptionsChange = new Executor();
    this.onRequest = new Executor();
    this.currentTask = null;

    makeObservable(this, {
      countGain: observable,
    });
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

  getResults(): TResult[] {
    return this.source.results;
  }

  getResult(index: number): TResult | null {
    return this.source.getResult(index);
  }

  setName(name: string | null){
    this.name = name;
    return this;
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

  async requestOptionsChange(): Promise<boolean> {
    const contexts = await this.onOptionsChange.execute();

    return ExecutorInterrupter.isInterrupted(contexts) === false;
  }

  async save(): Promise<void> {
    await this.requestSaveAction(() => this.source.saveData());
  }

  async retry(): Promise<void> {
    await this.requestDataAction(() => this.source.retry());
  }

  async refresh(concurrent?: boolean): Promise<void> {
    if (concurrent) {
      await this.source.refreshData();
      return;
    }
    await this.requestDataAction(() => this.source.refreshData());
  }

  async request(concurrent?: boolean): Promise<void> {
    if (concurrent) {
      await this.source.requestData();
      return;
    }
    await this.requestDataAction(() => this.source.requestData());
  }

  async reload(): Promise<void> {
    await this.requestDataAction(() => this.source
      .setSlice(0, this.countGain)
      .requestData()
    );
  }

  async requestDataPortion(offset: number, count: number): Promise<void> {
    if (!this.isDataAvailable(offset, count)) {
      await this.requestDataAction(() => this.source
        .setSlice(offset, count)
        .requestData()
      );
    }
  }

  cancel(): Promise<void> | void {
    return this.source.cancel();
  }

  resetData(): void {
    this.source.resetData();
  }

  async dispose(): Promise<void> {
    await this.source.dispose();
  }

  async requestSaveAction(action: () => Promise<void> | void): Promise<void> {
    return action();
  }

  async requestDataAction(action: () => Promise<void> | void): Promise<void> {
    if (this.currentTask) {
      return this.currentTask;
    }

    try {
      this.currentTask = this.requestDataActionTask(action);
      return await this.currentTask;
    } finally {
      this.currentTask = null;
    }
  }

  private async requestDataActionTask(action: () => Promise<void> | void): Promise<void> {
    let contexts = await this.onRequest.execute({ type: 'on', model: this });

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    contexts = await this.onRequest.execute({ type: 'before', model: this });

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    await action();
    await this.onRequest.execute({ type: 'after', model: this });
  }
}
