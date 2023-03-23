/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

import { BaseSqlDataSource } from './BaseSqlDataSource';
import { ESqlDataSourceFeatures } from './ESqlDataSourceFeatures';

export class MemorySqlDataSource extends BaseSqlDataSource {
  static key = 'memory-6';

  get name(): string | null {
    return this._name;
  }

  get script(): string {
    return this._script;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this._executionContext;
  }

  get features(): ESqlDataSourceFeatures[] {
    return [ESqlDataSourceFeatures.script, ESqlDataSourceFeatures.setName];
  }

  private _name: string | null;
  private _script: string;
  private _executionContext?: IConnectionExecutionContextInfo;

  constructor(
    name: string | null = null,
    script = '',
    executionContext?: IConnectionExecutionContextInfo
  ) {
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

  isReadonly(): boolean {
    return false;
  }

  setScript(script: string): void {
    this._script = script;
    super.setScript(script);
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    this._executionContext = executionContext;
    super.setExecutionContext(executionContext);
  }

  setName(name: string | null): void {
    this._name = name;
    super.setName(name);
  }

  canRename(name: string | null): boolean {
    return true;
  }
}