/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

import { BaseSqlDataSource } from '../BaseSqlDataSource';
import { ESqlDataSourceFeatures } from '../ESqlDataSourceFeatures';
import type { ILocalStorageSqlDataSourceState } from './ILocalStorageSqlDataSourceState';

export class LocalStorageSqlDataSource extends BaseSqlDataSource {
  get baseScript(): string {
    return this.state.script;
  }

  get baseExecutionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.executionContext;
  }

  static key = 'local-storage';

  get name(): string | null {
    return this.state.name ?? null;
  }

  get script(): string {
    return this.state.script;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.executionContext;
  }

  get features(): ESqlDataSourceFeatures[] {
    return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.query, ESqlDataSourceFeatures.executable, ESqlDataSourceFeatures.setName];
  }

  get isSaved(): boolean {
    return true;
  }

  private state!: ILocalStorageSqlDataSourceState;

  constructor(state: ILocalStorageSqlDataSourceState) {
    super();
    this.bindState(state);

    makeObservable<this, 'state'>(this, {
      state: observable.ref,
      script: computed,
      executionContext: computed,
    });
  }

  isReadonly(): boolean {
    return false;
  }

  setName(name: string | null): void {
    this.state.name = name ?? undefined;
    super.setName(name);
  }

  canRename(name: string | null): boolean {
    return true;
  }

  setScript(script: string): void {
    this.state.script = script;
    super.setScript(script);
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    this.state.executionContext = executionContext;
    super.setExecutionContext(executionContext);
  }

  bindState(state: ILocalStorageSqlDataSourceState): void {
    this.state = state;
    this.outdated = false;
    this.history.restore(state.history);
  }

  protected setBaseScript(script: string): void {
    this.state.script = script;
  }

  protected setBaseExecutionContext(executionContext: IConnectionExecutionContextInfo | undefined): void {
    this.state.executionContext = executionContext;
  }
}
