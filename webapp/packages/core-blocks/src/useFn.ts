/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useRef } from 'react';

const noop: any[] = [];

export function useFn<TArgs extends any[], TValue>(fn: (...args: TArgs) => TValue): (...args: TArgs) => TValue {
  const ref = useRef(fn);
  ref.current = fn;

  return useCallback((...args: TArgs) => ref.current(...args), noop);
}