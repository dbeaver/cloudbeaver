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

function item(uri: string, owner: INodeDeletionProvider, ancestors: string[] = [], batchKey?: string): INodeDeletionItem {
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
  return { node, provider: owner, ancestors, batchKey };
}

describe('executeNodeDeletionPlan', () => {
  it('keeps non-destructive ancestors eligible while excluding a read-only database subtree', async () => {
    const connections = Object.assign(provider(), { keepChildren: true });
    const folders = Object.assign(batchProvider(), { keepChildren: true });
    const database = batchProvider();
    const folder = item('folder', folders);
    const connection = item('connection', connections, ['folder']);
    const schema = item('schema', database, ['folder', 'connection']);
    const table = {
      node: item('table', database).node,
      ancestors: ['folder', 'connection', 'schema'],
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

  it('batches independent targets only within their provider and batch key', async () => {
    const navigator = batchProvider();
    const resources = batchProvider();
    const a = item('a', navigator, [], 'project-a');
    const b = item('b', navigator, [], 'project-a');
    const c = item('c', navigator, [], 'project-b');
    const d = item('d', resources, [], 'project-a');

    await executeNodeDeletionPlan([a, c, d, b]);

    expect(navigator.deleteBatch).toHaveBeenNthCalledWith(1, [a.node, b.node]);
    expect(navigator.deleteBatch).toHaveBeenNthCalledWith(2, [c.node]);
    expect(resources.deleteBatch).toHaveBeenCalledWith([d.node]);
  });

  it('does not put an ancestor and descendant in the same backend batch', async () => {
    const owner = batchProvider();
    const folder = item('folder', owner, [], 'project');
    const child = item('child', owner, ['folder'], 'project');

    await executeNodeDeletionPlan([folder, child]);

    expect(owner.deleteBatch).toHaveBeenNthCalledWith(1, [child.node]);
    expect(owner.deleteBatch).toHaveBeenNthCalledWith(2, [folder.node]);
  });

  it.each(['failed', 'cancelled'] as const)('continues independent work but skips ancestors after a child is %s', async status => {
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

  it('skips unavailable targets and their ancestors without preventing independent batches', async () => {
    const owner = batchProvider();
    const parent = item('parent', owner, [], 'batch');
    const child = { node: item('child', owner).node, ancestors: ['parent'], reason: 'no-permission' };
    const independent = item('independent', owner, [], 'batch');

    const plan = prepareNodeDeletionPlan([parent, independent], [child]);
    await executeNodeDeletionPlan(plan.items);

    expect(owner.deleteBatch).toHaveBeenCalledExactlyOnceWith([independent.node]);
    expect(plan.exclusions).toEqual([child, { node: parent.node, ancestors: [], reason: 'plugin_navigation_tree_delete_dependent_unavailable' }]);
  });

  it('executes the single-node strategy sequentially even when batch keys match', async () => {
    const owner = provider();
    let running = false;
    owner.deleteNode = vi.fn(async (node: NavNode) => {
      expect(running).toBe(false);
      expect(node.uri).toMatch(/^[ab]$/);
      running = true;
      await Promise.resolve();
      running = false;
    });

    const a = item('a', owner, [], 'same-key');
    const b = item('b', owner, [], 'same-key');
    await executeNodeDeletionPlan([a, b]);

    expect(owner.deleteNode).toHaveBeenCalledTimes(2);
    expect(owner.deleteNode).toHaveBeenNthCalledWith(1, a.node);
    expect(owner.deleteNode).toHaveBeenNthCalledWith(2, b.node);
  });

  it('never retries a failed batch and does not delete its selected parents', async () => {
    const owner = batchProvider();
    owner.deleteBatch = vi.fn(() => Promise.reject(new Error('Partial batch failure')));
    const a = item('a', owner, ['parent'], 'batch');
    const b = item('b', owner, ['parent'], 'batch');
    const parent = item('parent', owner, [], 'batch');

    const results = await executeNodeDeletionPlan([parent, a, b]);

    expect(owner.deleteBatch).toHaveBeenCalledExactlyOnceWith([a.node, b.node]);
    expect(results.map(result => result.status)).toEqual(['unknown', 'unknown', 'skipped']);
    expect(results[0]?.batch).toEqual([a, b]);
    expect(results[1]?.batch).toBe(results[0]?.batch);
  });

  it('batches independent nodes without requiring an explicit batch key', async () => {
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
