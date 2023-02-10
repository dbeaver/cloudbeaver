/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { isContainsException, staticImplements } from '@cloudbeaver/core-utils';
import type { IDatabaseDataModel, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

import type { IDataQueryOptions } from '../QueryDataSource';
import { ESqlDataSourceFeatures } from './ESqlDataSourceFeatures';
import type { ISqlDataSource, ISqlDataSourceKey } from './ISqlDataSource';

@staticImplements<ISqlDataSourceKey>()
export abstract class BaseSqlDataSource implements ISqlDataSource {
  static key = 'base';
  abstract get name(): string | null;
  abstract get script(): string;
  abstract get executionContext(): IConnectionExecutionContextInfo | undefined;
  databaseModels: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>[];
  exception?: Error | Error[] | null | undefined;
  message?: string;

  get sourceKey(): string {
    return Object.getPrototypeOf(this).constructor.key;
  }

  get projectId(): string | null {
    return null;
  }

  get features(): ESqlDataSourceFeatures[] {
    return [ESqlDataSourceFeatures.script];
  }

  readonly onSetScript: ISyncExecutor<string>;
  readonly onDatabaseModelUpdate: ISyncExecutor<IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>[]>;

  protected outdated: boolean;
  protected editing: boolean;

  constructor() {
    this.databaseModels = [];
    this.exception = undefined;
    this.message = undefined;
    this.outdated = true;
    this.editing = true;
    this.onSetScript = new SyncExecutor();
    this.onDatabaseModelUpdate = new SyncExecutor();

    this.onDatabaseModelUpdate.setInitialDataGetter(() => this.databaseModels);

    makeObservable<this, 'outdated' | 'editing'>(this, {
      databaseModels: observable.ref,
      exception: observable.ref,
      outdated: observable.ref,
      message: observable.ref,
      editing: observable.ref,
    });
  }

  setScript(script: string): void {
    this.onSetScript.execute(script);
  }

  abstract canRename(name: string | null): boolean;
  abstract setName(name: string | null): void;
  abstract setExecutionContext(executionContext?: IConnectionExecutionContextInfo | undefined): void;

  isError(): boolean {
    return isContainsException(this.exception);
  }

  isEditing(): boolean {
    return this.editing;
  }

  isReadonly(): boolean {
    return true;
  }

  isOutdated(): boolean {
    return this.outdated;
  }

  markUpdated(): void {
    this.outdated = false;
  }

  markOutdated(): void {
    this.outdated = true;
  }

  isLoading(): boolean {
    return false;
  }

  isLoaded(): boolean {
    if (
      Array.isArray(this.exception)
        ? this.exception.some(Boolean)
        : !!this.exception
    ) {
      return false;
    }

    return true;
  }

  hasFeature(feature: ESqlDataSourceFeatures): boolean {
    return this.features.includes(feature);
  }

  setEditing(state: boolean): void {
    this.editing = state;
  }

  setProject(projectId: string | null): void {

  }

  load(): Promise<void> | void { }
  dispose(): void | Promise<void> { }
}