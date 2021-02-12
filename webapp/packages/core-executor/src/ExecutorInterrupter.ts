/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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

  interrupter(flag: () => boolean) {
    return (data: any, contexts: IExecutionContextProvider<any>): void => {
      const interrupt = contexts.getContext(ExecutorInterrupter.interruptContext);

      if (flag()) {
        interrupt.interrupt();
      }
    };
  },
};
