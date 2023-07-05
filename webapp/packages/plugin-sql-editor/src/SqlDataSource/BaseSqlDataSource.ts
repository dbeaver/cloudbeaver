/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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
import type { ISetScriptData, ISqlDataSource, ISqlDataSourceKey } from './ISqlDataSource';
import type { ISqlDataSourceHistory } from './SqlDataSourceHistory/ISqlDataSourceHistory';
import { SqlDataSourceHistory } from './SqlDataSourceHistory/SqlDataSourceHistory';

const SOURCE_HISTORY = 'history';

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
    return this.executionContext?.projectId ?? null;
  }

  get features(): ESqlDataSourceFeatures[] {
    return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.query, ESqlDataSourceFeatures.executable];
  }

  readonly icon: string;
  readonly history: ISqlDataSourceHistory;
  readonly onUpdate: ISyncExecutor;
  readonly onSetScript: ISyncExecutor<ISetScriptData>;
  readonly onDatabaseModelUpdate: ISyncExecutor<IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>[]>;

  protected saved: boolean;
  protected outdated: boolean;
  protected editing: boolean;

  constructor(icon = '/icons/sql_script_m.svg') {
    this.icon = icon;
    this.databaseModels = [];
    this.exception = undefined;
    this.message = undefined;
    this.outdated = true;
    this.editing = true;
    this.saved = true;
    this.history = new SqlDataSourceHistory();
    this.onUpdate = new SyncExecutor();
    this.onSetScript = new SyncExecutor();
    this.onDatabaseModelUpdate = new SyncExecutor();

    this.onDatabaseModelUpdate.setInitialDataGetter(() => this.databaseModels);
    this.onSetScript.next(this.onUpdate);
    this.onSetScript.addHandler(({ script, source }) => {
      if (source === SOURCE_HISTORY) {
        return;
      }
      this.history.add(script);
    });

    this.history.onNavigate.addHandler(value => this.setScript(value, SOURCE_HISTORY));

    makeObservable<this, 'outdated' | 'editing' | 'saved'>(this, {
      databaseModels: observable.ref,
      exception: observable.ref,
      outdated: observable.ref,
      message: observable.ref,
      editing: observable.ref,
      saved: observable.ref,
    });
  }

  setScript(script: string, source?: string): void {
    this.saved = false;
    this.onSetScript.execute({ script, source });
  }

  abstract canRename(name: string | null): boolean;

  setName(name: string | null): void {
    this.onUpdate.execute();
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo | undefined): void {
    this.saved = false;
    this.onUpdate.execute();
  }

  isSaved(): boolean {
    return this.saved;
  }

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
    if (Array.isArray(this.exception) ? this.exception.some(Boolean) : !!this.exception) {
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
    this.onUpdate.execute();
  }

  save(): Promise<void> | void {}
  load(): Promise<void> | void {}
  reset(): Promise<void> | void {
    this.saved = true;
  }
  dispose(): void | Promise<void> {}
}
