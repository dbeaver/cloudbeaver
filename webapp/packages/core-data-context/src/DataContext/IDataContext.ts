/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { DataContextGetter } from './DataContextGetter.js';
import type { IDataContextProvider } from './IDataContextProvider.js';

export type DeleteVersionedContextCallback = () => void;

export interface IDataContext extends IDataContextProvider {
  set: <T>(context: DataContextGetter<T>, value: T, id: string) => this;
  delete: (context: DataContextGetter<any>, id?: string) => this;
  deleteForId: (id: string) => this;
  clear: () => void;
  setFallBack: (fallback?: IDataContextProvider) => void;
}
