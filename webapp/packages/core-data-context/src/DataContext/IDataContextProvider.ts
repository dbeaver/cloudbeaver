/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter } from './DataContextGetter.js';

export interface IDataContextProvider {
  has: (context: DataContextGetter<any>) => boolean;
  hasOwn: (context: DataContextGetter<any>) => boolean;
  get: <T>(context: DataContextGetter<T>) => T | undefined;
  getOwn: <T>(context: DataContextGetter<T>) => T | undefined;
  find: <T>(context: DataContextGetter<T>, predicate: (item: T) => boolean) => T | undefined;
  hasOwnValue: <T>(context: DataContextGetter<T>, value: T) => boolean;
  hasValue: <T>(context: DataContextGetter<T>, value: T) => boolean;
}
