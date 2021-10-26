/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ContextGetter } from './ContextGetter';

export function createContext<T>(name: string): ContextGetter<T> {
  function fn(): T {
    return null as any as T;
  }
  fn.name = `@context/${name}`;
  return fn;
}
