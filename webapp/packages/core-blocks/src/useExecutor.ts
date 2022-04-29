/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import type { IExecutor, IExecutorHandler, IExecutorHandlersCollection } from '@cloudbeaver/core-executor';

import { useObjectRef } from './useObjectRef';

interface IUseExecutorOptions<T> {
  executor?: IExecutor<T> | IExecutorHandlersCollection<T>;
  handlers?: Array<IExecutorHandler<T>>;
  postHandlers?: Array<IExecutorHandler<T>>;
}

export function useExecutor<T>(options: IUseExecutorOptions<T>): void {
  const props = useObjectRef(options);
  const executor = props.executor;

  useEffect(() => {
    if (!executor) {
      return;
    }

    const handlers: Array<IExecutorHandler<T>> = [];
    const postHandlers: Array<IExecutorHandler<T>> = [];

    if (props.handlers) {
      for (let i = 0; i < props.handlers.length; i++) {
        const handler: IExecutorHandler<T> = (data, contexts) => props.handlers?.[i](data, contexts);
        executor.addHandler(handler);
        handlers.push(handler);
      }
    }
    if (props.postHandlers) {
      for (let i = 0; i < props.postHandlers.length; i++) {
        const handler: IExecutorHandler<T> = (data, contexts) => props.postHandlers?.[i](data, contexts);
        executor.addPostHandler(handler);
        postHandlers.push(handler);
      }
    }

    return () => {
      for (const handler of handlers) {
        executor.removeHandler(handler);
      }
      for (const handler of postHandlers) {
        executor.removePostHandler(handler);
      }
    };
  }, [executor, props.handlers?.length, props.postHandlers?.length]);
}
