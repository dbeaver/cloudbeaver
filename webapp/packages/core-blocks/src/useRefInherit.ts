/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useObjectRef } from './useObjectRef.js';

interface IPrivateRef<T> {
  value: T;
  current: T;
}

export function useRefInherit<T>(refInherit?: React.Ref<T>): React.RefObject<T> {
  return useObjectRef<IPrivateRef<T>>(() => ({
    value: null as unknown as T,
    get current(): T {
      return this.value;
    },
    set current(value: T) {
      this.value = value;
      if (typeof refInherit === 'function') {
        refInherit(value);
      } else if (refInherit && 'current' in refInherit) {
        refInherit.current = value;
      }
    },
  }));
}
