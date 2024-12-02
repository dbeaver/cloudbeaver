/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createExtension, type IExtension, isExtension } from '@cloudbeaver/core-extensions';

import type { IConnectionExecutionContextInfo } from '../ConnectionExecutionContext/ConnectionExecutionContextResource.js';

const EXECUTION_CONTEXT_PROVIDER_SYMBOL = Symbol('@extension/ExecutionContextProvider');

export type IExecutionContextProvider<T = never> = (context: T) => IConnectionExecutionContextInfo | undefined;

export function executionContextProvider<T>(provider: IExecutionContextProvider<T>) {
  return createExtension<T>(provider, EXECUTION_CONTEXT_PROVIDER_SYMBOL);
}

export function isExecutionContextProvider<T>(obj: IExtension<T>): obj is IExecutionContextProvider<T> & IExtension<T> {
  return isExtension(obj, EXECUTION_CONTEXT_PROVIDER_SYMBOL);
}
