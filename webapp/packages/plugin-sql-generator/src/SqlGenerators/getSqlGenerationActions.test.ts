/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getSqlGenerationActions } from './getSqlGenerationActions.js';

describe('multi-object SQL generation actions', () => {
  const first = { uri: 'connection-a/table', objectFeatures: ['entity', 'script'] };
  const second = { uri: 'connection-b/view', objectFeatures: ['entity', 'script'] };
  const procedure = { uri: 'connection-a/procedure', objectFeatures: ['script'] };
  const folder = { uri: 'connection-a/tables', objectFeatures: [] };
  const select = { id: 'tableSelect', label: 'SELECT', description: 'Select from table', order: 1, multiObject: false };
  const simpleJoin = { id: 'tableJoin', label: 'SIMPLE JOIN', description: 'Join tables', order: 6, multiObject: true };
  const innerJoin = { id: 'tableInnerJoin', label: 'INNER JOIN', description: 'Join tables', order: 7, multiObject: true };
  const ddl = { id: 'tableDDL', label: 'DDL', description: 'Get DDL', order: 1001, multiObject: false };

  it('passes only entities to JOIN while retaining script objects for ordinary generators', () => {
    expect(getSqlGenerationActions([first, folder, procedure, second], [select, simpleJoin, innerJoin, ddl])).toEqual([
      { generator: select, nodes: [first, procedure, second] },
      { generator: simpleJoin, nodes: [first, second] },
      { generator: innerJoin, nodes: [first, second] },
      { generator: ddl, nodes: [first, procedure, second] },
    ]);
  });

  it('does not count folders or procedures toward the two-entity JOIN minimum', () => {
    expect(getSqlGenerationActions([first, folder, procedure], [select, simpleJoin, innerJoin])).toEqual([
      { generator: select, nodes: [first, procedure] },
    ]);
  });

  it('does not invent JOIN actions when the server does not offer them', () => {
    expect(getSqlGenerationActions([first, second], [select])).toEqual([{ generator: select, nodes: [first, second] }]);
  });

  it('returns no actions when only unrelated nodes are selected', () => {
    expect(getSqlGenerationActions([folder], [select, simpleJoin, innerJoin, ddl])).toEqual([]);
  });
});
