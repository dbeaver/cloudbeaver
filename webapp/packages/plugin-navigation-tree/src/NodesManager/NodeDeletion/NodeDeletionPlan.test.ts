/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { executeNodeDeletionPlan, type INodeDeletionItem, type INodeDeletionProvider } from './NodeDeletionPlan.js';

type NavNode = INodeDeletionItem['node'];

function provider(): INodeDeletionProvider {
  return {
    isApplicable: () => true,
    getInfo: () => ({ type: 'object' }),
    handler: vi.fn(() => Promise.resolve(true)),
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
  return { node, provider: owner, ancestors, batchKey, type: 'object', project: 'project', location: '' };
}

describe('executeNodeDeletionPlan', () => {
  it('deletes database objects before their connection and connection before its folder, without pruning explicit targets', async () => {
    const calls: string[] = [];
    const owner = provider();
    owner.handler = vi.fn((nodes: NavNode[]) => {
      calls.push(...nodes.map(node => node.uri));
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
    const navigator = provider();
    const resources = provider();
    const a = item('a', navigator, [], 'project-a');
    const b = item('b', navigator, [], 'project-a');
    const c = item('c', navigator, [], 'project-b');
    const d = item('d', resources, [], 'project-a');

    await executeNodeDeletionPlan([a, c, d, b]);

    expect(navigator.handler).toHaveBeenNthCalledWith(1, [a.node, b.node]);
    expect(navigator.handler).toHaveBeenNthCalledWith(2, [c.node]);
    expect(resources.handler).toHaveBeenCalledWith([d.node]);
  });

  it('does not put an ancestor and descendant in the same backend batch', async () => {
    const owner = provider();
    const folder = item('folder', owner, [], 'project');
    const child = item('child', owner, ['folder'], 'project');

    await executeNodeDeletionPlan([folder, child]);

    expect(owner.handler).toHaveBeenNthCalledWith(1, [child.node]);
    expect(owner.handler).toHaveBeenNthCalledWith(2, [folder.node]);
  });

  it.each(['failed', 'cancelled'] as const)('continues independent work but skips ancestors after a child is %s', async status => {
    const owner = provider();
    owner.handler = vi.fn((nodes: NavNode[]) => {
      if (nodes[0]?.uri === 'child') {
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
    expect(owner.handler).toHaveBeenCalledTimes(2);
  });

  it('skips unavailable targets and their ancestors without preventing independent batches', async () => {
    const owner = provider();
    const parent = item('parent', owner, [], 'batch');
    const child = { ...item('child', owner, ['parent']), reason: 'no-permission' };
    const independent = item('independent', owner, [], 'batch');

    const results = await executeNodeDeletionPlan([parent, child, independent]);

    expect(owner.handler).toHaveBeenCalledExactlyOnceWith([independent.node]);
    expect(results.find(result => result.item === parent)?.status).toBe('skipped');
  });

  it('falls back to sequential single-target operations when the provider has no batch API', async () => {
    const owner = provider();
    let running = false;
    owner.handler = vi.fn(async (nodes: NavNode[]) => {
      expect(running).toBe(false);
      expect(nodes).toHaveLength(1);
      running = true;
      await Promise.resolve();
      running = false;
    });

    await executeNodeDeletionPlan([item('a', owner), item('b', owner)]);

    expect(owner.handler).toHaveBeenCalledTimes(2);
  });

  it('never retries a failed batch and does not delete its selected parents', async () => {
    const owner = provider();
    owner.handler = vi.fn(() => Promise.reject(new Error('Partial batch failure')));
    const a = item('a', owner, ['parent'], 'batch');
    const b = item('b', owner, ['parent'], 'batch');
    const parent = item('parent', owner, [], 'batch');

    const results = await executeNodeDeletionPlan([parent, a, b]);

    expect(owner.handler).toHaveBeenCalledExactlyOnceWith([a.node, b.node]);
    expect(results.map(result => result.status)).toEqual(['failed', 'failed', 'skipped']);
  });
});
