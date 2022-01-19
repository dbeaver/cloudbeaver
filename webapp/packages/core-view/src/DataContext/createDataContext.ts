/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DataContextGetter } from './DataContextGetter';

export function createDataContext<T>(name: string, defaultValue?: T): DataContextGetter<T> {
  name = `@context/${name}`;
  const obj = {
    [name](): T {
      return defaultValue as T;
    },
  };
  return obj[name];
}
