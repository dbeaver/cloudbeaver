/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getGeneratedSqlContext } from './generatedSqlContext.js';

describe('generated SQL context', () => {
  const connection = { id: 'connection', projectId: 'project', name: 'Database' };
  const node = { connection, container: { catalogId: 'catalog', schemaId: 'schema' }, objectFeatures: [] };

  it('preserves the common connection and schema', () => {
    expect(getGeneratedSqlContext('tableSelect', [node, { ...node }])).toEqual({
      connection,
      catalogId: 'catalog',
      schemaId: 'schema',
      hasFullDdl: false,
    });
  });

  it.each([
    [{ catalogId: 'catalog', schemaId: 'other' }, 'catalog'],
    [{ catalogId: 'other', schemaId: 'schema' }, undefined],
  ])('does not reuse the first schema across different containers: %j', (container, catalogId) => {
    expect(getGeneratedSqlContext('tableSelect', [node, { ...node, container }])).toEqual({
      connection,
      catalogId,
      schemaId: undefined,
      hasFullDdl: false,
    });
  });

  it.each([{ ...connection, id: 'other' }, { ...connection, projectId: 'other' }, undefined])(
    'does not attach mixed or unknown connections to the first database: %j',
    other => {
      expect(getGeneratedSqlContext('tableSelect', [node, { ...node, connection: other }])).toEqual({
        connection: undefined,
        catalogId: undefined,
        schemaId: undefined,
        hasFullDdl: false,
      });
    },
  );

  it('offers full DDL only for DDL generators when an object supports it', () => {
    const nodes = [node, { ...node, objectFeatures: ['supportsFullDdl'] }];
    expect(getGeneratedSqlContext('tableDDL', nodes).hasFullDdl).toBe(true);
    expect(getGeneratedSqlContext('tableSelect', nodes).hasFullDdl).toBe(false);
    expect(getGeneratedSqlContext('tableDDL', [node]).hasFullDdl).toBe(false);
  });
});
