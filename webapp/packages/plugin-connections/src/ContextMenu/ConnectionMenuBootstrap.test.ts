/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { EConnectionFeature, NAV_NODE_TYPE_CONNECTION } from '@cloudbeaver/core-connections';
import { ENodeFeature, EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import type { INodeDeletionProvider } from '@cloudbeaver/plugin-navigation-tree';

import { ConnectionMenuBootstrap } from './ConnectionMenuBootstrap.js';

type Dependencies = ConstructorParameters<typeof ConnectionMenuBootstrap>;
const TABLE: NavNode = {
  uri: 'node://project/datasources/connection/table',
  projectId: 'project',
  objectId: 'connection',
  nodeType: 'Table',
  name: 'table',
  folder: false,
  hasChildren: false,
  inline: false,
  navigable: true,
  filtered: false,
  objectFeatures: [],
  features: [ENodeFeature.canDelete],
};

function setup(features: EConnectionFeature[] = []) {
  const connection = { canDelete: true, features };
  const connections = {
    get: vi.fn(() => connection),
    load: vi.fn(() => Promise.resolve(connection)),
    getConnectionIdForNodeId: () => ({ projectId: 'project', connectionId: 'connection' }),
  };
  const manager = { deleteConnection: vi.fn().mockResolvedValue(true) };
  const tree = { deleteNode: vi.fn().mockResolvedValue(undefined) };
  const providers: INodeDeletionProvider[] = [];
  const bootstrap = new ConnectionMenuBootstrap(
    {} as Dependencies[0],
    connections as unknown as Dependencies[1],
    {} as Dependencies[2],
    {} as Dependencies[3],
    manager as unknown as Dependencies[4],
    { addHandler: vi.fn() } as unknown as Dependencies[5],
    { addCreator: vi.fn(), setHandler: vi.fn() } as unknown as Dependencies[6],
    {} as Dependencies[7],
    {} as Dependencies[8],
    {} as Dependencies[9],
    {} as Dependencies[10],
    {} as Dependencies[11],
    { registerProvider: (provider: INodeDeletionProvider) => providers.push(provider) } as unknown as Dependencies[12],
    tree as unknown as Dependencies[13],
  );
  bootstrap.register();
  return { connection, connections, manager, tree, providers, provider: providers.find(provider => provider.isApplicable(TABLE))! };
}

describe('connection node deletion permissions', () => {
  it.each([EConnectionFeature.readOnly, EConnectionFeature.restrictMetadataEdit])('blocks database-object deletion with %s', async feature => {
    const { provider, tree } = setup([feature]);

    expect(provider.isDisabled?.(TABLE)).toBe(true);
    await expect(provider.deleteBatch!([TABLE])).resolves.toBe(false);
    expect(tree.deleteNode).not.toHaveBeenCalled();
  });

  it('explains the read-only restriction in confirmation metadata', async () => {
    const { provider } = setup([EConnectionFeature.readOnly]);

    expect(await provider.getInfo(TABLE)).toMatchObject({
      type: 'plugin_connections_delete_database_object',
      readOnly: true,
      reason: 'plugin_connections_delete_read_only',
    });
  });

  it('rechecks a connection that becomes read-only while loading its metadata', async () => {
    const { provider, connection, connections, tree } = setup();
    expect(provider.isDisabled?.(TABLE)).toBe(false);
    connections.load.mockImplementation(() => {
      connection.features = [EConnectionFeature.readOnly];
      return Promise.resolve(connection);
    });

    expect((await provider.getInfo(TABLE)).reason).toBe('plugin_connections_delete_read_only');
    await expect(provider.deleteBatch!([TABLE])).resolves.toBe(false);
    expect(tree.deleteNode).not.toHaveBeenCalled();
  });

  it('deletes database objects on a writable connection', async () => {
    const { provider, tree } = setup();

    expect(provider.isDisabled?.(TABLE)).toBe(false);
    await provider.deleteBatch!([TABLE]);

    expect(tree.deleteNode).toHaveBeenCalledExactlyOnceWith(resourceKeyList([TABLE.uri]));
  });

  it('allows removing the saved read-only connection when its configuration can be deleted', async () => {
    const { providers, manager } = setup([EConnectionFeature.readOnly]);
    const saved = {
      ...TABLE,
      uri: 'node://project/datasources/connection',
      nodeType: NAV_NODE_TYPE_CONNECTION,
      objectFeatures: [EObjectFeature.dataSource],
    };
    const provider = providers.find(provider => provider.isApplicable(saved))!;

    expect(provider.isDisabled?.(saved)).toBe(false);
    expect((await provider.getInfo(saved)).readOnly).toBe(true);
    await provider.deleteNode!(saved);

    expect(manager.deleteConnection).toHaveBeenCalledExactlyOnceWith({ projectId: 'project', connectionId: 'connection' });
  });
});
