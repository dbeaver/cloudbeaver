/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { uuid } from '@cloudbeaver/core-utils';

import type { DataContextGetter } from './DataContextGetter';
import type { IDataContextProvider } from './IDataContextProvider';

export function createDataContext<T>(
  name: string,
  defaultValue?: (context: IDataContextProvider) => T extends any ? T : undefined,
): DataContextGetter<T> {
  name = `@context/${name}`;
  const obj = {
    [name](context: IDataContextProvider): T {
      return defaultValue?.(context) as T;
    },
  };
  Object.defineProperty(obj[name], 'id', { value: uuid() });
  return obj[name] as DataContextGetter<T>;
}
