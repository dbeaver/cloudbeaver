/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { executeNodeDeletionPlan, prepareNodeDeletionPlan, type INodeDeletionItem, type INodeDeletionProvider } from './NodeDeletionPlan.js';

type NavNode = INodeDeletionItem['node'];

function provider(): INodeDeletionProvider {
  return {
    isApplicable: () => true,
    getInfo: () => ({ type: 'object' }),
    deleteNode: vi.fn(() => Promise.resolve(true)),
  };
}

function batchProvider(): INodeDeletionProvider {
  return {
    isApplicable: () => true,
    getInfo: () => ({ type: 'object' }),
    deleteBatch: vi.fn(() => Promise.resolve(true)),
  };
}

function item(uri: string, owner: INodeDeletionProvider, parents: string[] = []): INodeDeletionItem {
  const node: NavNode = {
    uri,
    name: uri,
    hasChildren: false,
    folder: false,
    inline: false,
    navigable: true,
    filtered: false,
    objectFeatures: [],
  };
  return { node, provider: owner, parents };
}

describe('executeNodeDeletionPlan', () => {
  it('skips cyclic ancestry while still deleting independent nodes', async () => {
    const owner = provider();
    const a = item('a', owner, ['b']);
    const b = item('b', owner, ['a']);
    const independent = item('independent', owner);

    const results = await executeNodeDeletionPlan([a, independent, b]);

    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(independent.node);
    expect(results.map(result => [result.item.node.uri, result.status])).toEqual([
      ['independent', 'deleted'],
      ['a', 'skipped'],
      ['b', 'skipped'],
    ]);
  });

  it('keeps provider call order when single-node and batch targets are interleaved', async () => {
    const calls: string[][] = [];
    const single = provider();
    const bulk = batchProvider();
    single.deleteNode = node => {
      calls.push([node.uri]);
      return Promise.resolve();
    };
    bulk.deleteBatch = nodes => {
      calls.push(nodes.map(node => node.uri));
      return Promise.resolve();
    };

    await executeNodeDeletionPlan([item('a', single), item('b', bulk), item('c', single), item('d', bulk), item('e', single)]);

    expect(calls).toEqual([['a'], ['b', 'd'], ['c'], ['e']]);
  });

  it('protects all destructive ancestors after cancellation even through a keepChildren parent', async () => {
    const owner = provider();
    const connection = Object.assign(provider(), { keepChildren: true });
    owner.deleteNode = vi.fn().mockResolvedValue(false);
    const root = item('root', owner);
    const parent = item('parent', connection, ['root']);
    const child = item('child', owner, ['root', 'parent']);

    const results = await executeNodeDeletionPlan([root, parent, child]);

    expect(results.map(result => [result.item.node.uri, result.status])).toEqual([
      ['child', 'cancelled'],
      ['parent', 'deleted'],
      ['root', 'skipped'],
    ]);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(child.node);
    expect(connection.deleteNode).toHaveBeenCalledExactlyOnceWith(parent.node);
  });

  it('keeps non-destructive parents eligible while excluding a read-only database subtree', async () => {
    const connections = Object.assign(provider(), { keepChildren: true });
    const folders = Object.assign(batchProvider(), { keepChildren: true });
    const database = batchProvider();
    const folder = item('folder', folders);
    const connection = item('connection', connections, ['folder']);
    const schema = item('schema', database, ['folder', 'connection']);
    const table = {
      node: item('table', database).node,
      parents: ['folder', 'connection', 'schema'],
      reason: 'read-only',
    };

    const plan = prepareNodeDeletionPlan([folder, connection, schema], [table]);
    await executeNodeDeletionPlan(plan.items);

    expect(plan.items).toEqual([folder, connection]);
    expect(plan.exclusions.map(item => item.node.uri)).toEqual(['table', 'schema']);
    expect(database.deleteBatch).not.toHaveBeenCalled();
    expect(connections.deleteNode).toHaveBeenCalledExactlyOnceWith(connection.node);
    expect(folders.deleteBatch).toHaveBeenCalledExactlyOnceWith([folder.node]);
  });

  it('still removes saved configuration after a database-object batch fails', async () => {
    const connections = Object.assign(provider(), { keepChildren: true });
    const folders = Object.assign(batchProvider(), { keepChildren: true });
    const database = batchProvider();
    database.deleteBatch = vi.fn().mockRejectedValue(new Error('Cannot drop table'));
    const folder = item('folder', folders);
    const connection = item('connection', connections, ['folder']);
    const table = item('table', database, ['folder', 'connection']);

    const results = await executeNodeDeletionPlan([folder, connection, table]);

    expect(results.map(result => [result.item.node.uri, result.status])).toEqual([
      ['table', 'unknown'],
      ['connection', 'deleted'],
      ['folder', 'deleted'],
    ]);
    expect(connections.deleteNode).toHaveBeenCalledExactlyOnceWith(connection.node);
    expect(folders.deleteBatch).toHaveBeenCalledExactlyOnceWith([folder.node]);
  });

  it('deletes database objects before their connection and connection before its folder, without pruning explicit targets', async () => {
    const calls: string[] = [];
    const owner = provider();
    owner.deleteNode = vi.fn((node: NavNode) => {
      calls.push(node.uri);
      return Promise.resolve(true);
    });
    const folder = item('folder', owner);
    const connection = item('connection', owner, ['folder']);
    const table = item('table', owner, ['folder', 'connection']);

    const results = await executeNodeDeletionPlan([folder, connection, table]);

    expect(calls).toEqual(['table', 'connection', 'folder']);
    expect(results.every(result => result.status === 'deleted')).toBe(true);
  });

  it('batches independent targets by provider across projects and connections', async () => {
    const navigator = batchProvider();
    const resources = batchProvider();
    const a = item('node://project-a/datasources/connection-a/table', navigator);
    const b = item('node://project-a/datasources/connection-b/table', navigator);
    const c = item('node://project-b/datasources/connection-c/table', navigator);
    const d = item('resource', resources);
    a.node.projectId = b.node.projectId = 'project-a';
    c.node.projectId = 'project-b';

    await executeNodeDeletionPlan([a, c, d, b]);

    expect(navigator.deleteBatch).toHaveBeenCalledExactlyOnceWith([a.node, c.node, b.node]);
    expect(resources.deleteBatch).toHaveBeenCalledWith([d.node]);
  });

  it('does not put an ancestor and descendant in the same backend batch', async () => {
    const owner = batchProvider();
    const folder = item('folder', owner);
    const child = item('child', owner, ['folder']);

    await executeNodeDeletionPlan([folder, child]);

    expect(owner.deleteBatch).toHaveBeenNthCalledWith(1, [child.node]);
    expect(owner.deleteBatch).toHaveBeenNthCalledWith(2, [folder.node]);
  });

  it.each(['failed', 'cancelled'] as const)('continues independent work but skips parents after a child is %s', async status => {
    const owner = provider();
    owner.deleteNode = vi.fn((node: NavNode) => {
      if (node.uri === 'child') {
        return status === 'failed' ? Promise.reject(new Error('Cannot delete')) : Promise.resolve(false);
      }
      return Promise.resolve(true);
    });
    const parent = item('parent', owner);
    const child = item('child', owner, ['parent']);
    const independent = item('independent', owner);

    const results = await executeNodeDeletionPlan([parent, child, independent]);

    expect(results.map(result => [result.item.node.uri, result.status])).toEqual([
      ['child', status],
      ['independent', 'deleted'],
      ['parent', 'skipped'],
    ]);
    expect(owner.deleteNode).toHaveBeenCalledTimes(2);
  });

  it('skips unavailable targets and their parents without preventing independent batches', async () => {
    const owner = batchProvider();
    const parent = item('parent', owner);
    const child = { node: item('child', owner).node, parents: ['parent'], reason: 'no-permission' };
    const independent = item('independent', owner);

    const plan = prepareNodeDeletionPlan([parent, independent], [child]);
    await executeNodeDeletionPlan(plan.items);

    expect(owner.deleteBatch).toHaveBeenCalledExactlyOnceWith([independent.node]);
    expect(plan.exclusions).toEqual([child, { node: parent.node, parents: [], reason: 'plugin_navigation_tree_delete_dependent_unavailable' }]);
  });

  it('executes the single-node strategy sequentially', async () => {
    const owner = provider();
    let running = false;
    owner.deleteNode = vi.fn(async (node: NavNode) => {
      expect(running).toBe(false);
      expect(node.uri).toMatch(/^[ab]$/);
      running = true;
      await Promise.resolve();
      running = false;
    });

    const a = item('a', owner);
    const b = item('b', owner);
    await executeNodeDeletionPlan([a, b]);

    expect(owner.deleteNode).toHaveBeenCalledTimes(2);
    expect(owner.deleteNode).toHaveBeenNthCalledWith(1, a.node);
    expect(owner.deleteNode).toHaveBeenNthCalledWith(2, b.node);
  });

  it('never retries a failed batch and does not delete its selected parents', async () => {
    const owner = batchProvider();
    owner.deleteBatch = vi.fn(() => Promise.reject(new Error('Partial batch failure')));
    const a = item('a', owner, ['parent']);
    const b = item('b', owner, ['parent']);
    const parent = item('parent', owner);

    const results = await executeNodeDeletionPlan([parent, a, b]);

    expect(owner.deleteBatch).toHaveBeenCalledExactlyOnceWith([a.node, b.node]);
    expect(results.map(result => result.status)).toEqual(['unknown', 'unknown', 'skipped']);
    expect(results[0]?.batch).toEqual([a, b]);
    expect(results[1]?.batch).toBe(results[0]?.batch);
  });

  it('reports success for all nodes in a completed batch', async () => {
    const owner = batchProvider();
    const a = item('a', owner);
    const b = item('b', owner);

    const results = await executeNodeDeletionPlan([a, b]);

    expect(owner.deleteBatch).toHaveBeenCalledExactlyOnceWith([a.node, b.node]);
    expect(results.map(result => result.status)).toEqual(['deleted', 'deleted']);
  });

  it('preserves dependencies between single-node and batch providers', async () => {
    const atomic = provider();
    const bulk = batchProvider();
    atomic.deleteNode = vi.fn().mockResolvedValue(false);
    const parent = item('parent', bulk);
    const child = item('child', atomic, ['parent']);
    const independent = item('independent', bulk);

    const results = await executeNodeDeletionPlan([parent, child, independent]);

    expect(atomic.deleteNode).toHaveBeenCalledExactlyOnceWith(child.node);
    expect(bulk.deleteBatch).toHaveBeenCalledExactlyOnceWith([independent.node]);
    expect(results.map(result => [result.item.node.uri, result.status])).toEqual([
      ['child', 'cancelled'],
      ['independent', 'deleted'],
      ['parent', 'skipped'],
    ]);
  });
});
