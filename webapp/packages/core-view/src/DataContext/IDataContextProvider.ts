/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { DataContextGetter } from './DataContextGetter';

export interface IDataContextProvider {
  fallback?: IDataContextProvider;
  has: (context: DataContextGetter<any>) => boolean;
  get: <T>(context: DataContextGetter<T>) => T;
  find: <T>(context: DataContextGetter<T>, value: T) => boolean;
  tryGet: <T>(context: DataContextGetter<T>) => T | undefined;
}
