/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from './useObjectRef';

export function useCombinedHandler<T extends any[]>(
  ...handlers: Array<((...args: T) => any) | undefined>
): (...args: T) => void  {
  const optionsRef = useObjectRef({ handlers });
  const state = useObjectRef(
    () => ({
      handler(...args: T) {
        for (const handler of optionsRef.handlers) {
          handler?.(...args);
        }
      },
    }),
    false,
  );

  return state.handler;
}
