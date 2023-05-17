/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

export function useCombinedRef<T>(...refs: React.ForwardedRef<T>[]) {
  return useCallback((instance: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(instance);
      } else if (ref) {
        (ref as React.MutableRefObject<T>).current = instance;
      }
    }
  }, refs);
}