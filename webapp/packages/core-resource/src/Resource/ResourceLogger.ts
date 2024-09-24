/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ExecutorInterrupter, type IExecutorHandler, type ISyncExecutor } from '@cloudbeaver/core-executor';

export enum ResourceLoggerLevel {
  None,
  Error,
  Warn,
  Log,
}

export class ResourceLogger {
  protected level: ResourceLoggerLevel;
  constructor(private name: string) {
    this.level = ResourceLoggerLevel.Warn;
  }

  setEnabled(level: ResourceLoggerLevel) {
    this.level = level;
  }

  getName(): string {
    return this.name;
  }

  group(action: string) {
    if (this.level >= ResourceLoggerLevel.Log) {
      console.group(this.getActionPrefixedName(action));
    }
  }

  groupEnd() {
    if (this.level >= ResourceLoggerLevel.Log) {
      console.groupEnd();
    }
  }

  log(action: string, ...params: any[]) {
    if (this.level >= ResourceLoggerLevel.Log) {
      console.log(this.getActionPrefixedName(action), ...params);
    }
  }

  warn(action: string) {
    if (this.level >= ResourceLoggerLevel.Warn) {
      console.warn(this.getActionPrefixedName(action));
    }
  }

  error(action: string) {
    if (this.level >= ResourceLoggerLevel.Error) {
      console.error(this.getActionPrefixedName(action));
    }
  }

  spy(executor: ISyncExecutor<any>, action: string): void {
    executor.addHandler(this.logExecutor(action)).addPostHandler(this.logInterrupted(action));
  }

  logExecutor =
    (action: string): IExecutorHandler<any> =>
    () => {
      this.log(action);
    };

  private readonly logInterrupted =
    (action: string): IExecutorHandler<any> =>
    (data, contexts) => {
      if (ExecutorInterrupter.isInterrupted(contexts)) {
        this.log(action + 'interrupted');
      }
    };

  protected getActionPrefixedName(action: string): string {
    return this.getName() + ': ' + action;
  }
}
