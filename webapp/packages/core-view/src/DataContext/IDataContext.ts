/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter } from './DataContextGetter';
import type { IDataContextProvider } from './IDataContextProvider';

export type DeleteVersionedContextCallback = () => void;

export interface IDataContext extends IDataContextProvider {
  set: <T>(context: DataContextGetter<T>, value: T) => DeleteVersionedContextCallback;
  delete: (context: DataContextGetter<any>, version?: number) => this;
}
