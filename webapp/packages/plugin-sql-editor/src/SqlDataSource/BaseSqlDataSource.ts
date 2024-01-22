/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable, toJS } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { isContainsException, isValuesEqual, staticImplements } from '@cloudbeaver/core-utils';
import type { IDatabaseDataModel, IDatabaseResultSet } from '@cloudbeaver/plugin-data-viewer';

import type { IDataQueryOptions } from '../QueryDataSource';
import { ESqlDataSourceFeatures } from './ESqlDataSourceFeatures';
import type { ISetScriptData, ISqlDataSource, ISqlDataSourceKey } from './ISqlDataSource';
import type { ISqlDataSourceHistory } from './SqlDataSourceHistory/ISqlDataSourceHistory';
import { SqlDataSourceHistory } from './SqlDataSourceHistory/SqlDataSourceHistory';

@staticImplements<ISqlDataSourceKey>()
export abstract class BaseSqlDataSource implements ISqlDataSource {
  static key = 'base';
  abstract get name(): string | null;
  abstract get script(): string;
  abstract get baseScript(): string;
  abstract get baseExecutionContext(): IConnectionExecutionContextInfo | undefined;
  abstract get executionContext(): IConnectionExecutionContextInfo | undefined;
  databaseModels: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>[];
  exception?: Error | Error[] | null | undefined;
  message?: string;
  incomingScript: string | undefined;
  incomingExecutionContext: IConnectionExecutionContextInfo | undefined | null;

  get isIncomingChanges(): boolean {
    return this.incomingScript !== undefined || this.incomingExecutionContext !== null;
  }

  get isAutoSaveEnabled(): boolean {
    return true;
  }

  get isScriptSaved(): boolean {
    return this.script === this.baseScript;
  }

  get isExecutionContextSaved(): boolean {
    return (
      isValuesEqual(this.baseExecutionContext?.connectionId, this.executionContext?.connectionId, undefined) &&
      isValuesEqual(this.baseExecutionContext?.defaultCatalog, this.executionContext?.defaultCatalog, undefined) &&
      isValuesEqual(this.baseExecutionContext?.defaultSchema, this.executionContext?.defaultSchema, undefined)
    );
  }

  get isSaved(): boolean {
    return this.isScriptSaved && this.isExecutionContextSaved;
  }

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

  protected outdated: boolean;
  protected editing: boolean;

  constructor(icon = '/icons/sql_script_m.svg') {
    this.icon = icon;
    this.databaseModels = [];
    this.incomingScript = undefined;
    this.incomingExecutionContext = null;
    this.exception = undefined;
    this.message = undefined;
    this.outdated = true;
    this.editing = true;
    this.history = new SqlDataSourceHistory();
    this.onUpdate = new SyncExecutor();
    this.onSetScript = new SyncExecutor();
    this.onDatabaseModelUpdate = new SyncExecutor();

    this.onDatabaseModelUpdate.setInitialDataGetter(() => this.databaseModels);
    this.onSetScript.next(this.onUpdate);
    this.onSetScript.addHandler(({ script, source }) => {
      if (source === 'history') {
        return;
      }
      this.history.add(script);
    });

    this.history.onNavigate.addHandler(value => this.setScript(value, 'history'));

    makeObservable<this, 'outdated' | 'editing'>(this, {
      isSaved: computed,
      isIncomingChanges: computed,
      isAutoSaveEnabled: computed,
      isScriptSaved: computed,
      isExecutionContextSaved: computed,
      setScript: action,
      setIncomingScript: action,
      setName: action,
      setExecutionContext: action,
      setIncomingExecutionContext: action,
      markUpdated: action,
      markOutdated: action,
      setEditing: action,
      setProject: action,
      applyIncoming: action,
      keepCurrent: action,
      reset: action,
      databaseModels: observable.ref,
      exception: observable.ref,
      outdated: observable.ref,
      message: observable.ref,
      editing: observable.ref,
      incomingScript: observable.ref,
      incomingExecutionContext: observable.ref,
    });
  }

  setScript(script: string, source?: string): void {
    this.onSetScript.execute({ script, source });
  }

  setIncomingScript(script: string): void {
    if (script !== this.baseScript) {
      if (this.script === this.baseScript) {
        this.setBaseScript(script);
        this.setScript(script);
      } else {
        this.incomingScript = script;
      }
    } else {
      this.incomingScript = undefined;
    }
  }

  abstract canRename(name: string | null): boolean;

  setName(name: string | null): void {
    this.onUpdate.execute();
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo | undefined): void {
    this.onUpdate.execute();
  }

  setIncomingExecutionContext(executionContext?: IConnectionExecutionContextInfo | undefined): void {
    executionContext = toJS(executionContext);

    this.setBaseExecutionContext(executionContext);
    this.setExecutionContext(executionContext);

    // TODO: we need to display execution context changes
    // if (!isObjectsEqual(executionContext, toJS(this.baseExecutionContext))) {
    //   if (isObjectsEqual(this.executionContext, toJS(this.baseExecutionContext))) {
    //     this.setBaseExecutionContext(executionContext);
    //     this.setExecutionContext(executionContext);
    //   } else {
    //     this.incomingExecutionContext = executionContext;
    //   }
    // } else {
    //   this.incomingExecutionContext = null;
    // }
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

  keepCurrent(): void {
    if (this.incomingScript !== undefined) {
      this.setBaseScript(this.incomingScript);
      this.incomingScript = undefined;
    }
    if (this.incomingExecutionContext !== null) {
      this.setBaseExecutionContext(this.incomingExecutionContext);
      this.incomingExecutionContext = null;
    }
  }

  applyIncoming(): void {
    if (this.incomingScript !== undefined) {
      this.setBaseScript(this.incomingScript);
    }
    if (this.incomingExecutionContext !== null) {
      this.setBaseExecutionContext(this.incomingExecutionContext);
    }
    this.reset();
  }

  save(): Promise<void> | void {
    this.markUpdated();
  }

  load(): Promise<void> | void {
    this.markUpdated();
  }

  reset(): Promise<void> | void {
    this.setScript(this.baseScript);
    this.setExecutionContext(this.baseExecutionContext);
    this.incomingScript = undefined;
    this.incomingExecutionContext = null;
  }

  dispose(): void | Promise<void> {}

  protected abstract setBaseScript(script: string): void;
  protected abstract setBaseExecutionContext(executionContext: IConnectionExecutionContextInfo | undefined): void;
}
