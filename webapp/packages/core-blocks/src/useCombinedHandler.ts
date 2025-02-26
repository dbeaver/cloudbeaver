/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from './useObjectRef.js';

export function useCombinedHandler<T extends any[]>(...handlers: Array<((...args: T) => any) | null | undefined>): (...args: T) => void {
  const state = useObjectRef(
    () => ({
      handler(...args: T) {
        for (const handler of this.handlers) {
          handler?.(...args);
        }
      },
    }),
    { handlers },
    ['handler'],
  );

  return state.handler;
}
