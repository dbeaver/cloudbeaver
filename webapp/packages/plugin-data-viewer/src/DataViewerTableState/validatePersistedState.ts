/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { schema } from '@cloudbeaver/core-utils';

import type { IDataViewerPersistedState } from './IDataViewerPersistedState.js';

const persistedConstraintSchema = schema.object({
  attributeName: schema.string().min(1),
  operator: schema.string().optional(),
  value: schema.unknown().optional(),
  orderAsc: schema.boolean().optional(),
  orderPosition: schema.number().optional(),
});

const persistedStateSchema = schema.object({
  constraints: schema.array(persistedConstraintSchema),
  whereFilter: schema.string(),
  pinnedColumns: schema.array(schema.string()).optional().default([]),
  columnOrder: schema.array(schema.string()).optional(),
});

export function validatePersistedState(data: unknown): data is IDataViewerPersistedState {
  return persistedStateSchema.safeParse(data).success;
}
