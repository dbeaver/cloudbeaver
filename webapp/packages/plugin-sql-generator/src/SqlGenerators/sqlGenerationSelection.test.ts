/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getSqlGenerationNodes, haveSameSqlGenerationConnection, isSqlGenerationNode } from './sqlGenerationSelection.js';

describe('SQL generation selection', () => {
  const first = { uri: 'connection-a/table' };
  const second = { uri: 'connection-b/table' };

  it('preserves selection order across connections and removes stale entries and duplicates', () => {
    expect(getSqlGenerationNodes(first, [second, undefined, first, second])).toEqual([second, first]);
  });

  it('uses only the context node when right-clicking outside the selection', () => {
    expect(getSqlGenerationNodes(first, [second])).toEqual([first]);
  });

  it('does not generate from a selection without a context node', () => {
    expect(getSqlGenerationNodes(undefined, [first])).toEqual([]);
  });

  it('keeps entities and script objects but excludes folders', () => {
    const entity = { objectFeatures: ['entity'] };
    const script = { objectFeatures: ['script'] };
    const folder = { objectFeatures: [] };
    expect([folder, entity, script].filter(isSqlGenerationNode)).toEqual([entity, script]);
  });
});

describe('SQL generation connection identity', () => {
  const connection = { id: 'connection', projectId: 'project' };

  it('recognizes separate objects representing the same connection', () => {
    expect(haveSameSqlGenerationConnection([connection, { ...connection }])).toBe(true);
  });

  it.each([{ id: 'other', projectId: 'project' }, { id: 'connection', projectId: 'other' }, undefined])(
    'rejects a different or missing connection: %j',
    other => {
      expect(haveSameSqlGenerationConnection([connection, other])).toBe(false);
    },
  );

  it('does not infer a connection from an empty selection', () => {
    expect(haveSameSqlGenerationConnection([])).toBe(false);
  });
});
