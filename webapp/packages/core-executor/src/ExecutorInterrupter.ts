/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IExecutionContextProvider } from './IExecutionContext';

export interface IExecutorInterrupter {
  interrupted: boolean;
  interrupt: () => void;
}

export const ExecutorInterrupter = {
  isInterrupted(contexts: IExecutionContextProvider<any>): boolean {
    const interrupt = contexts.getContext(ExecutorInterrupter.interruptContext);

    return interrupt.interrupted;
  },

  interrupt(contexts: IExecutionContextProvider<any>): void {
    const interrupt = contexts.getContext(ExecutorInterrupter.interruptContext);

    interrupt.interrupt();
  },

  interruptContext(): IExecutorInterrupter {
    return {
      interrupted: false,
      interrupt() {
        this.interrupted = true;
      },
    };
  },

  interrupter<T>(flag: (data: T, context: IExecutionContextProvider<T>) => Promise<boolean> | boolean) {
    return async (data: T, contexts: IExecutionContextProvider<T>): Promise<void> => {
      const interrupt = contexts.getContext(ExecutorInterrupter.interruptContext);

      if ((await flag(data, contexts))) {
        interrupt.interrupt();
      }
    };
  },
};
