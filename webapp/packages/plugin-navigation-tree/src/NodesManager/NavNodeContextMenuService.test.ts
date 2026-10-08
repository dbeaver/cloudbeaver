/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { EConnectionFeature, NAV_NODE_TYPE_CONNECTION } from '@cloudbeaver/core-connections';
import { DataContext } from '@cloudbeaver/core-data-context';
import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { Executor } from '@cloudbeaver/core-executor';
import { DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_NAV_NODES, ENodeFeature, NAV_NODE_TYPE_FOLDER, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList, type ResourceKeySimple } from '@cloudbeaver/core-resource';
import { ACTION_DELETE, type IActionHandlerOptions } from '@cloudbeaver/core-view';

import { NavNodeContextMenuService } from './NavNodeContextMenuService.js';

function createNode(uri: string, options: Partial<NavNode> = {}): NavNode {
  return {
    uri,
    name: uri,
    projectId: 'project',
    nodeType: 'table',
    folder: false,
    hasChildren: false,
    inline: false,
    navigable: true,
    filtered: false,
    objectFeatures: [],
    features: [ENodeFeature.canDelete],
    ...options,
  };
}

function setup(nodes: NavNode[]) {
  const context = new DataContext().set(DATA_CONTEXT_NAV_NODE, nodes[0]!, 'test').set(DATA_CONTEXT_NAV_NODES, () => nodes, 'test');
  const handlers: IActionHandlerOptions[] = [];
  const dialog = { open: vi.fn().mockResolvedValue({ status: DialogueStateResult.Resolved }) };
  const tree = { beforeNodeDelete: new Executor<ResourceKeySimple<string>>(), deleteNode: vi.fn() };
  const connections = { deleteConnection: vi.fn() };
  const notification = { logException: vi.fn() };
  const connectionInfo = {
    getConnectionIdForNodeId: vi.fn((projectId: string, uri: string) => ({ projectId, connectionId: uri.split('/')[4]! })),
    get: vi.fn(() => ({ canDelete: true, features: [] as string[] })),
  };
  const nodeInfo = {
    get: (uri: string) => nodes.find(node => node.uri === uri),
    getParents: (uri: string): string[] => {
      const parent = nodes.find(node => node.uri === uri)?.parentId;
      return parent ? [parent, ...nodeInfo.getParents(parent)] : [];
    },
  };
  const service = new NavNodeContextMenuService(
    ...([
      {},
      notification,
      dialog,
      tree,
      { addHandler: (handler: IActionHandlerOptions) => handlers.push(handler) },
      { setHandler: vi.fn(), addCreator: vi.fn() },
      { translate: (key: string, _: unknown, args?: { name: string }) => args?.name ?? key },
      nodeInfo,
      {},
      connectionInfo,
      connections,
    ] as unknown as ConstructorParameters<typeof NavNodeContextMenuService>),
  );
  service.register();
  const handler = handlers.find(handler => handler.id === 'nav-node-delete')!;
  return { context, service, handler, dialog, tree, connections, connectionInfo, notification };
}

describe('navigation tree delete selection', () => {
  it('confirms all selected nodes once and uses each connection key', async () => {
    const connection = createNode('node://project/datasources/first', { nodeType: NAV_NODE_TYPE_CONNECTION });
    const table = createNode('node://other/datasources/second/table', { projectId: 'other' });
    const { handler, context, dialog, tree, connections, connectionInfo } = setup([connection, table]);

    expect(handler.isActionApplicable!(context, ACTION_DELETE)).toBe(true);
    expect(connectionInfo.getConnectionIdForNodeId).toHaveBeenCalledWith('other', table.uri);
    await handler.handler(context, ACTION_DELETE);

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialog.open).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ message: `${connection.name}, ${table.name}` }));
    expect(tree.deleteNode).toHaveBeenCalledWith(resourceKeyList([table.uri]), true);
    expect(connections.deleteConnection).toHaveBeenCalledWith(resourceKeyList([{ projectId: 'project', connectionId: 'first' }]), true);
  });

  it('does not delete anything when confirmation is cancelled', async () => {
    const { handler, context, dialog, tree, connections } = setup([
      createNode('node://project/datasources/first', { nodeType: NAV_NODE_TYPE_CONNECTION }),
      createNode('node://project/datasources/second/table'),
    ]);
    dialog.open.mockResolvedValue({ status: DialogueStateResult.Rejected });

    await handler.handler(context, ACTION_DELETE);

    expect(tree.deleteNode).not.toHaveBeenCalled();
    expect(connections.deleteConnection).not.toHaveBeenCalled();
  });

  it('checks delete permissions on every selected connection', () => {
    const { handler, context, connectionInfo } = setup([
      createNode('node://project/datasources/first', { nodeType: NAV_NODE_TYPE_CONNECTION }),
      createNode('node://project/datasources/second', { nodeType: NAV_NODE_TYPE_CONNECTION }),
    ]);
    connectionInfo.get.mockReturnValueOnce({ canDelete: true, features: [] }).mockReturnValueOnce({ canDelete: false, features: [] });

    expect(handler.isActionApplicable!(context, ACTION_DELETE)).toBe(false);
  });

  it('checks metadata restrictions on the connection of each selected object', () => {
    const { handler, context, connectionInfo } = setup([
      createNode('node://project/datasources/first/table'),
      createNode('node://project/datasources/second/table'),
    ]);
    connectionInfo.get
      .mockReturnValueOnce({ canDelete: true, features: [] })
      .mockReturnValueOnce({ canDelete: true, features: [EConnectionFeature.restrictMetadataEdit] });

    expect(handler.isActionApplicable!(context, ACTION_DELETE)).toBe(false);
  });

  it('does not delete a selected child twice when its folder is selected', () => {
    const folder = createNode('rm://project/scripts', { folder: true });
    const child = createNode('rm://project/scripts/query.sql', { parentId: folder.uri });
    const { service, context } = setup([folder, child]);

    expect(service.getNodesToDelete(context)).toEqual([folder]);
  });

  it('keeps selected database objects under a selected connection and deletes them first', async () => {
    const connection = createNode('node://project/datasources/first', { nodeType: NAV_NODE_TYPE_CONNECTION });
    const table = createNode(`${connection.uri}/table`, { parentId: connection.uri });
    const { service, handler, context, tree, connections } = setup([connection, table]);

    expect(service.getNodesToDelete(context)).toEqual([connection, table]);
    await handler.handler(context, ACTION_DELETE);

    expect(tree.deleteNode.mock.invocationCallOrder[0]).toBeLessThan(connections.deleteConnection.mock.invocationCallOrder[0]!);
  });

  it('deduplicates nested connection folders but keeps their selected connections', async () => {
    const folder = createNode('node://project/folder', { nodeType: NAV_NODE_TYPE_FOLDER, folder: true });
    const child = createNode('node://project/child', { nodeType: NAV_NODE_TYPE_FOLDER, parentId: folder.uri, folder: true });
    const connection = createNode('node://project/datasources/first', { nodeType: NAV_NODE_TYPE_CONNECTION, parentId: child.uri });
    const { service, context, handler, tree, connectionInfo, connections } = setup([folder, child, connection]);
    tree.deleteNode.mockImplementation(() => {
      connectionInfo.getConnectionIdForNodeId.mockImplementation(() => {
        throw new Error('Folder deletion removed its nodes from the cache');
      });
    });

    expect(service.getNodesToDelete(context)).toEqual([folder, connection]);
    await handler.handler(context, ACTION_DELETE);

    expect(tree.deleteNode).toHaveBeenCalledWith(resourceKeyList([folder.uri]), true);
    expect(connections.deleteConnection).toHaveBeenCalledWith(resourceKeyList([{ projectId: 'project', connectionId: 'first' }]), true);
  });

  it('preserves single-node deletion without a selection context', async () => {
    const node = createNode('node://project/datasources/first/table');
    const { handler, context, tree } = setup([node]);
    context.delete(DATA_CONTEXT_NAV_NODES);

    await handler.handler(context, ACTION_DELETE);

    expect(tree.deleteNode).toHaveBeenCalledWith(resourceKeyList([node.uri]), true);
  });

  it('reports a deletion failure and does not continue deleting connections', async () => {
    const { handler, context, tree, connections, notification } = setup([
      createNode('node://project/datasources/first', { nodeType: NAV_NODE_TYPE_CONNECTION }),
      createNode('node://project/datasources/second/table'),
    ]);
    const error = new Error('Deletion failed');
    tree.deleteNode.mockRejectedValue(error);

    await handler.handler(context, ACTION_DELETE);

    expect(notification.logException).toHaveBeenCalledWith(error, expect.any(String));
    expect(connections.deleteConnection).not.toHaveBeenCalled();
  });
});
