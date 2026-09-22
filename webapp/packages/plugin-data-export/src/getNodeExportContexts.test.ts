/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';

import { getNodeExportContexts, type INodeExportConnection, isExportableNode } from './getNodeExportContexts.js';

const CONNECTION: INodeExportConnection = {
  key: { projectId: 'g_GlobalConfiguration', connectionId: 'mysql-local' },
  name: 'MySQL',
};

function createNode(name: string, objectFeatures: string[] = [EObjectFeature.dataContainer], schema = 'test'): NavNode {
  return {
    uri: `database://mysql-local/schema/${schema}/table/${name}`,
    name,
    objectFeatures,
  } as NavNode;
}

function getConnection(): INodeExportConnection | undefined {
  return CONNECTION;
}

describe('isExportableNode', () => {
  it('accepts data containers', () => {
    expect(isExportableNode(createNode('users'))).toBe(true);
  });

  it('rejects nodes without the data container feature', () => {
    expect(isExportableNode(createNode('id', [EObjectFeature.entity]))).toBe(false);
  });
});

describe('getNodeExportContexts', () => {
  it('returns no contexts for an empty selection', () => {
    expect(getNodeExportContexts([], getConnection)).toEqual([]);
  });

  it('builds a context per exportable node preserving the selection order', () => {
    const contexts = getNodeExportContexts([createNode('users'), createNode('orders')], getConnection);

    expect(contexts).toHaveLength(2);
    expect(contexts.map(context => context.name)).toEqual(['users', 'orders']);
    expect(contexts[0]?.containerNodePath).toBe('database://mysql-local/schema/test/table/users');
    expect(contexts[0]?.connectionKey).toEqual(CONNECTION.key);
  });

  it('skips nodes that are not data containers', () => {
    const contexts = getNodeExportContexts([createNode('users'), createNode('id', [EObjectFeature.entity])], getConnection);

    expect(contexts.map(context => context.name)).toEqual(['users']);
  });

  it('skips nodes without a resolvable connection', () => {
    const contexts = getNodeExportContexts([createNode('users'), createNode('orders')], nodeId =>
      nodeId.endsWith('users') ? CONNECTION : undefined,
    );

    expect(contexts.map(context => context.name)).toEqual(['users']);
  });

  it('prefixes the file name with the connection and object names', () => {
    const [context] = getNodeExportContexts([createNode('users')], getConnection);

    expect(context?.fileName).toMatch(/^MySQL - users/);
  });

  it('disambiguates file names when two selected objects share the same connection and name', () => {
    const contexts = getNodeExportContexts([createNode('users', undefined, 'public'), createNode('users', undefined, 'archive')], getConnection);

    expect(contexts[0]?.containerNodePath).toBe('database://mysql-local/schema/public/table/users');
    expect(contexts[1]?.containerNodePath).toBe('database://mysql-local/schema/archive/table/users');
    expect(contexts[0]?.fileName).toMatch(/^MySQL - users \d{4}-\d{2}-\d{2}/);
    expect(contexts[1]?.fileName).toMatch(/^MySQL - users \(2\) \d{4}-\d{2}-\d{2}/);
  });
});
