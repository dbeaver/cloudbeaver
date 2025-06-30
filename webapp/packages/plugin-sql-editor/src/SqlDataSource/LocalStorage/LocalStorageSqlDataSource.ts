/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

import { BaseSqlDataSource } from '../BaseSqlDataSource.js';
import { ESqlDataSourceFeatures } from '../ESqlDataSourceFeatures.js';
import type { ILocalStorageSqlDataSourceState } from './ILocalStorageSqlDataSourceState.js';
import type { ISqlEditorCursor } from '../ISqlDataSource.js';

export class LocalStorageSqlDataSource extends BaseSqlDataSource {
  get baseScript(): string {
    return this.state.script;
  }

  get baseExecutionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.executionContext;
  }

  static override key = 'local-storage';

  get name(): string | null {
    return this.state.name ?? null;
  }

  get script(): string {
    return this.state.script;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this.state.executionContext;
  }

  override get features(): ESqlDataSourceFeatures[] {
    return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.query, ESqlDataSourceFeatures.executable, ESqlDataSourceFeatures.setName];
  }

  override get isSaved(): boolean {
    return true;
  }

  override get projectId(): string | null {
    // we will be able to attach any connection from any project
    return null;
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

  override isReadonly(): boolean {
    return false;
  }

  override setName(name: string | null): void {
    this.state.name = name ?? undefined;
    super.setName(name);
  }

  canRename(name: string | null): boolean {
    return true;
  }

  override setScript(script: string, source?: string, cursor?: ISqlEditorCursor): void {
    this.state.script = script;
    super.setScript(script, source, cursor);
  }

  override setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
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
