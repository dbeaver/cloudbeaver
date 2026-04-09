/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataViewerPersistedState } from '../../DataViewerTableState/IDataViewerPersistedState.js';

export interface IDatabasePersistedStateAction {
  get<T>(key: string): T | undefined;
  set(key: string, value: unknown): void;
  delete(key: string): void;
  has(key: string): boolean;
  setStore(store: Record<string, unknown>): void;
}

export const PERSISTED_STATE_KEY = {
  constraints: 'constraints',
  whereFilter: 'whereFilter',
  pinnedColumns: 'pinnedColumns',
  columnOrder: 'columnOrder',
} as Record<keyof IDataViewerPersistedState, string>;
