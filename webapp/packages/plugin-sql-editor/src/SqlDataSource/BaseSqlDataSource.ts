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

import type { ISqlDataSource } from './ISqlDataSource';

export abstract class BaseSqlDataSource implements ISqlDataSource {
  abstract get script(): string;
  abstract get executionContext(): IConnectionExecutionContextInfo | undefined;
  exception?: Error | Error[] | null | undefined;
  message?: string;
  readonly onSetScript: ISyncExecutor<string>;

  protected outdated: boolean;
  constructor() {
    this.exception = undefined;
    this.message = undefined;
    this.outdated = true;
    this.onSetScript = new SyncExecutor();

    makeObservable<this, 'outdated'>(this, {
      exception: observable.ref,
      outdated: observable.ref,
      message: observable.ref,
    });
  }

  setScript(script: string): void {
    this.onSetScript.execute(script);
  }

  abstract setExecutionContext(executionContext?: IConnectionExecutionContextInfo | undefined): void;

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

  load(): Promise<void> | void { }
  dispose(): void | Promise<void> { }
}