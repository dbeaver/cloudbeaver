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

export class MemorySqlDataSource extends BaseSqlDataSource {
  static key = 'memory';

  get script(): string {
    return this._script;
  }

  get executionContext(): IConnectionExecutionContextInfo | undefined {
    return this._executionContext;
  }

  private _script: string;
  private _executionContext?: IConnectionExecutionContextInfo;

  constructor(script = '', executionContext?: IConnectionExecutionContextInfo) {
    super();
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

  setScript(script: string): void {
    this._script = script;
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    this._executionContext = executionContext;
  }
}