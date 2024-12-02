/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IExecutionContextProvider } from './IExecutionContext.js';
import type { IExecutorHandler } from './IExecutorHandler.js';

export type IExecutorHandlerFilter<T> = (data: T, contexts: IExecutionContextProvider<T>) => boolean;

export function executorHandlerFilter<T, TResult = any | Promise<any>>(
  filter: IExecutorHandlerFilter<T>,
  handler: IExecutorHandler<T, TResult>,
): IExecutorHandler<T, TResult | undefined> {
  return (data, context) => {
    if (filter(data, context)) {
      return handler(data, context);
    }
    return undefined;
  };
}
