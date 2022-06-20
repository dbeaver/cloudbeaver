/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import type { IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';

import type { ISqlDataSource } from './ISqlDataSource';

export class MemorySqlDataSource implements ISqlDataSource {
  static key = 'memory';

  script: string;
  executionContext?: IConnectionExecutionContextInfo;

  constructor(script = '', executionContext?: IConnectionExecutionContextInfo) {
    this.script = script;
    this.executionContext = executionContext;

    makeObservable(this, {
      script: observable,
      executionContext: observable,
    });
  }

  setScript(script: string): void {
    this.script = script;
  }

  setExecutionContext(executionContext?: IConnectionExecutionContextInfo): void {
    this.executionContext = executionContext;
  }
}