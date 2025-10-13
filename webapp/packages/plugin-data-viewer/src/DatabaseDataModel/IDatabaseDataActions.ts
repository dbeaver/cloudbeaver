/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createService, type SingleServiceType } from '@cloudbeaver/core-di';
import type { IDatabaseDataAction } from './IDatabaseDataAction.js';
import type { IDatabaseDataResult } from './IDatabaseDataResult.js';

export interface IDatabaseDataActions<TOptions, TResult extends IDatabaseDataResult> {
  getConstructor<T extends IDatabaseDataAction<TOptions, TResult>>(service: SingleServiceType<T>): SingleServiceType<T>;
  tryGet<T>(result: TResult, action: SingleServiceType<T, any[]>): T | undefined;
  tryGet<T>(result: TResult, action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T | undefined;
  get<T>(result: TResult, action: SingleServiceType<T, any[]>): T;
  get<T>(result: TResult, action: SingleServiceType<unknown>, implementation: SingleServiceType<T, any[]>): T;

  updateResults(results: TResult[]): this;
  registerAction<T>(service: SingleServiceType<any>, implementation: SingleServiceType<T, any[]>): this;
  unregisterAction<T>(service: SingleServiceType<any>, implementation: SingleServiceType<T, any[]>): void;
}

export const IDatabaseDataActions = createService<IDatabaseDataActions<any, any>>('IDatabaseDataActions');
