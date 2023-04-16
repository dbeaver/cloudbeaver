/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef } from './useObjectRef';

interface IPrivateRef<T> {
  value: T | null;
  current: T | null;
}

export function useRefInherit<T>(refInherit?: React.Ref<T>): React.RefObject<T> {
  return useObjectRef<IPrivateRef<T>>(() => ({
    value: null,
    get current(): T | null {
      return this.value;
    },
    set current(value: T | null) {
      this.value = value;
      if (typeof refInherit === 'function') {
        refInherit(value);
      } else if (refInherit && 'current' in refInherit) {
        //@ts-expect-error We know it, we want it
        refInherit.current = value;
      }
    },
  }));
}