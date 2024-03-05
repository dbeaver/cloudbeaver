/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback } from 'react';

export function useMergeRefs<T>(...refs: React.Ref<T>[]): React.RefCallback<T> {
  return useCallback(value => {
    refs.forEach(ref => {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref !== null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  }, refs);
}
