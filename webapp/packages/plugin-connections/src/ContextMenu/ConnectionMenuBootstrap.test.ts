/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { EConnectionFeature, NAV_NODE_TYPE_CONNECTION } from '@cloudbeaver/core-connections';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENodeFeature, EObjectFeature, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { NodeDeletionService, type INodeDeletionProvider } from '@cloudbeaver/plugin-navigation-tree';

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
  it('confirms and deletes a saved connection selected together with a read-only table', async () => {
    const { providers, manager, tree } = setup([EConnectionFeature.readOnly]);
    const saved = {
      ...TABLE,
      uri: 'node://project/datasources/connection',
      nodeType: NAV_NODE_TYPE_CONNECTION,
      objectFeatures: [EObjectFeature.dataSource],
    };
    type DeletionDependencies = ConstructorParameters<typeof NodeDeletionService>;
    const dialogs = {
      open: vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved, result: [saved.uri] }),
    };
    const notifications = { logSuccess: vi.fn(), logError: vi.fn(), logException: vi.fn() };
    const service = new NodeDeletionService(
      dialogs as unknown as DeletionDependencies[0],
      notifications as unknown as DeletionDependencies[1],
      { translate: (token: string) => token } as DeletionDependencies[2],
      {
        resolveParents: (uri: string) => Promise.resolve(uri === TABLE.uri ? [saved.uri] : []),
        get: () => saved,
      } as unknown as DeletionDependencies[3],
      { get: () => ({ name: 'Project' }) } as unknown as DeletionDependencies[4],
    );
    for (const provider of providers) {
      service.registerProvider(provider);
    }

    await service.delete([saved, TABLE]);

    expect(dialogs.open).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
      items: [
        expect.objectContaining({ id: saved.uri, keepChildren: true }),
        expect.objectContaining({ id: TABLE.uri, reason: 'plugin_connections_delete_read_only' }),
      ],
    });
    expect(manager.deleteConnection).toHaveBeenCalledExactlyOnceWith({ projectId: 'project', connectionId: 'connection' });
    expect(tree.deleteNode).not.toHaveBeenCalled();
    expect(notifications.logException).not.toHaveBeenCalled();
  });

  it.each([EConnectionFeature.readOnly, EConnectionFeature.restrictMetadataEdit])('blocks database-object deletion with %s', feature => {
    const { provider } = setup([feature]);

    expect(provider.isDisabled?.(TABLE)).toBe(true);
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
    const { provider, connection, connections } = setup();
    expect(provider.isDisabled?.(TABLE)).toBe(false);
    connections.load.mockImplementation(() => {
      connection.features = [EConnectionFeature.readOnly];
      return Promise.resolve(connection);
    });

    expect((await provider.getInfo(TABLE)).reason).toBe('plugin_connections_delete_read_only');
    expect(provider.isDisabled?.(TABLE)).toBe(true);
  });

  it('deletes database objects on a writable connection', async () => {
    const { provider, tree } = setup();

    expect(provider.isDisabled?.(TABLE)).toBe(false);
    await provider.deleteBatch!([TABLE]);

    expect(tree.deleteNode).toHaveBeenCalledExactlyOnceWith(resourceKeyList([TABLE.uri]));
  });

  it('batches database objects across projects through the deletion service', async () => {
    const { providers, tree } = setup();
    const other = { ...TABLE, uri: 'node://other/datasources/other-connection/table', projectId: 'other' };
    type DeletionDependencies = ConstructorParameters<typeof NodeDeletionService>;
    const notifications = { logSuccess: vi.fn(), logError: vi.fn(), logException: vi.fn() };
    const service = new NodeDeletionService(
      {
        open: vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved, result: [TABLE.uri, other.uri] }),
      } as unknown as DeletionDependencies[0],
      notifications as unknown as DeletionDependencies[1],
      { translate: (token: string) => token } as DeletionDependencies[2],
      { resolveParents: () => Promise.resolve([]) } as unknown as DeletionDependencies[3],
      { get: () => ({ name: 'Project' }) } as unknown as DeletionDependencies[4],
    );
    providers.forEach(provider => service.registerProvider(provider));

    await service.delete([TABLE, other]);

    expect(tree.deleteNode).toHaveBeenCalledExactlyOnceWith(resourceKeyList([TABLE.uri, other.uri]));
    expect(notifications.logError).not.toHaveBeenCalled();
    expect(notifications.logException).not.toHaveBeenCalled();
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
