/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

import { BaseSqlDataSource } from './BaseSqlDataSource.js';
import { ESqlDataSourceFeatures } from './ESqlDataSourceFeatures.js';
import type { ISqlEditorCursor } from './ISqlDataSource.js';

export class MemorySqlDataSource extends BaseSqlDataSource {
  get baseScript(): string {
    return this._script;
  }
  get baseExecutionContext(): IConnectionExecutionContextInfo | undefined {
    return this._executionContext;
  }
  static override key = 'memory';

  get name(): string | null {
    return this._name;
  }

  get script(): string {
    return this._script;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this._executionContext;
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

  private _name: string | null;
  private _script: string;
  private _executionContext?: IConnectionExecutionContextInfo;

  constructor(name: string | null = null, script = '', executionContext?: IConnectionExecutionContextInfo) {
    super();
    this._name = name;
    this._script = script;
    this._executionContext = executionContext;
    this.outdated = false;

    makeObservable<this, '_script' | '_executionContext'>(this, {
      _script: observable,
      _executionContext: observable,
      script: computed,
      executionContext: computed,
    });
  }

  override isReadonly(): boolean {
    return false;
  }

  override setScript(script: string, source?: string, cursor?: ISqlEditorCursor): void {
    this._script = script;
    super.setScript(script, source, cursor);
  }

  override setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    this._executionContext = executionContext;
    super.setExecutionContext(executionContext);
  }

  override setName(name: string | null): void {
    this._name = name;
    super.setName(name);
  }

  canRename(name: string | null): boolean {
    return true;
  }

  protected setBaseScript(script: string): void {
    this._script = script;
  }

  protected setBaseExecutionContext(executionContext: IConnectionExecutionContextInfo | undefined): void {
    this._executionContext = executionContext;
  }
}
