/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { reaction } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import { DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NavTreeResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';

import type { INodeDeletionItem, INodeDeletionProvider } from './NodeDeletionPlan.js';
import type { INodeDeletionDialogItem } from './NodeDeletionDialog.js';
import { NodeDeletionService } from './NodeDeletionService.js';

type Dependencies = ConstructorParameters<typeof NodeDeletionService>;

function node(uri: string, nodeType = 'connection'): INodeDeletionItem['node'] {
  return {
    uri,
    nodeType,
    name: uri,
    projectId: 'project',
    hasChildren: false,
    folder: false,
    inline: false,
    navigable: true,
    filtered: false,
    objectFeatures: [],
  };
}

function setup(status = DialogueStateResult.Resolved) {
  const dialogs = {
    open: vi.fn((_dialog: unknown, payload: { items: INodeDeletionDialogItem[] }) =>
      Promise.resolve({
        status,
        result: payload.items.filter(item => !item.reason).map(item => item.id),
      }),
    ),
  };
  const notifications = { logSuccess: vi.fn(), logError: vi.fn(), logException: vi.fn() };
  const localization = { translate: vi.fn((token: string) => token) };
  const nodes = { resolveParents: vi.fn().mockResolvedValue([]), getParents: vi.fn().mockReturnValue([]), get: vi.fn() };
  const projects = { get: vi.fn().mockReturnValue({ name: 'Project' }) };
  const service = new NodeDeletionService(
    dialogs as unknown as Dependencies[0],
    notifications as unknown as Dependencies[1],
    localization as unknown as Dependencies[2],
    nodes as unknown as Dependencies[3],
    projects as unknown as Dependencies[4],
  );
  const owner: INodeDeletionProvider = {
    isApplicable: target => target.nodeType === 'connection' || target.nodeType === 'rm.folder',
    isHidden: target => target.nodeType === 'rm.project' || target.uri === 'resource-root',
    isDisabled: target => target.uri === 'readonly',
    getInfo: vi.fn(() => ({ type: 'connection' })),
    deleteNode: vi.fn().mockResolvedValue(true),
  };
  service.registerProvider(owner);
  return { service, owner, dialogs, notifications, nodes, localization };
}

describe('NodeDeletionService', () => {
  it('does not register the same provider twice', () => {
    const { service, owner } = setup();
    owner.isApplicable = vi.fn(() => false);
    service.registerProvider(owner);

    expect(service.canDelete([node('unsupported')])).toBe(false);
    expect(owner.isApplicable).toHaveBeenCalledExactlyOnceWith(node('unsupported'));
  });

  it('deletes a mixed multi-project selection of nested folders and connections without reloading deleted paths', async () => {
    const { service, owner, notifications, nodes } = setup();
    const projectA = { ...node('node://project-a', 'project'), projectId: 'project-a', parentId: ROOT_NODE_PATH };
    const projectB = { ...node('node://project-b', 'project'), projectId: 'project-b', parentId: ROOT_NODE_PATH };
    const folder = (uri: string, parentId: string) => ({ ...node(uri, 'folder'), folder: true, parentId, projectId: projectA.projectId });
    const parent = folder(`${projectA.uri}/datasources/Regression`, projectA.uri);
    const child = folder(`${parent.uri}/New folder`, parent.uri);
    const nested = folder(`${child.uri}/New folder`, child.uri);
    const sibling = folder(`${parent.uri}/Other folder`, parent.uri);
    const connection = { ...node(`${nested.uri}/connection`), projectId: projectA.projectId, parentId: nested.uri };
    const otherConnection = { ...node(`${projectB.uri}/datasources/connection`), projectId: projectB.projectId, parentId: projectB.uri };
    const selection = [projectA, parent, child, nested, connection, sibling, projectB, otherConnection];
    const cachedNodes = new Map(selection.map(target => [target.uri, target]));
    const serverNodes = new Set(cachedNodes.keys());
    const children = new Map<string, string[]>();
    for (const target of selection) {
      const siblings = children.get(target.parentId) ?? [];
      siblings.push(target.uri);
      children.set(target.parentId, siblings);
    }
    nodes.get.mockImplementation((uri: string) => cachedNodes.get(uri));
    nodes.resolveParents.mockImplementation((uri: string) => {
      const parents: string[] = [];
      let parentId = cachedNodes.get(uri)?.parentId;
      while (parentId !== undefined) {
        parents.unshift(parentId);
        parentId = cachedNodes.get(parentId)?.parentId;
      }
      return Promise.resolve(parents);
    });

    const reloadVisibleChildren = () => {
      for (const paths of children.values()) {
        for (const path of paths) {
          if (!serverNodes.has(path)) {
            throw new Error(`Node '${path}' not found`);
          }
        }
      }
    };
    const navDeleteNodes = vi.fn(({ nodePaths }: { nodePaths: string[] }) => {
      for (const path of nodePaths) {
        if (!serverNodes.has(path)) {
          throw new Error(`Node '${path}' not found`);
        }
        expect([...serverNodes].some(candidate => candidate.startsWith(`${path}/`))).toBe(false);
        serverNodes.delete(path);
      }
      return Promise.resolve({ navDeleteNodes: nodePaths.length });
    });
    const tree: NavTreeResource = Object.assign(Object.create(NavTreeResource.prototype), {
      graphQLService: { sdk: { navDeleteNodes } },
      navNodeInfoResource: nodes,
      performUpdate: (_key: unknown, _includes: unknown, update: () => Promise<void>) => update(),
      data: children,
      dataSet: (uri: string, paths: string[]) => children.set(uri, paths),
      delete: (paths: string[]) =>
        paths.forEach(path => {
          children.delete(path);
          cachedNodes.delete(path);
        }),
      markOutdated: reloadVisibleChildren,
      onDataOutdated: { execute: reloadVisibleChildren },
      onItemUpdate: { execute: vi.fn() },
    });
    owner.deleteNode = vi.fn((target: INodeDeletionItem['node']) => {
      serverNodes.delete(target.uri);
      tree.deleteInNode(target.parentId!, [target.uri]);
      return Promise.resolve(true);
    });
    service.registerProvider({
      isApplicable: target => target.nodeType === 'folder',
      getInfo: () => ({ type: 'folder' }),
      deleteBatch: targets => tree.deleteNode(resourceKeyList(targets.map(target => target.uri))),
    });

    await service.delete(selection);

    expect(notifications.logException).not.toHaveBeenCalled();
    expect(notifications.logError).not.toHaveBeenCalled();
    expect(owner.deleteNode).toHaveBeenCalledTimes(2);
    expect([...serverNodes]).toEqual([projectA.uri, projectB.uri]);
    expect(reloadVisibleChildren).not.toThrow();
  });

  it.each([
    ['project', 'project'],
    ['rm-project', 'rm.project'],
    ['resource-root', 'rm.folder'],
    ['unsupported', 'root'],
    ['readonly', 'connection'],
  ])('does not offer deletion for %s', (uri, type) => {
    const { service } = setup();

    expect(service.canDelete([node(uri, type)])).toBe(false);
  });

  it('allows a mixed selection when at least one non-project node can be deleted', () => {
    const { service } = setup();

    expect(service.canDelete([node('project', 'project'), node('readonly'), node('connection')])).toBe(true);
  });

  it('allows providers to omit visibility and availability restrictions', async () => {
    const { service, notifications } = setup();
    const deleteNode = vi.fn().mockResolvedValue(undefined);
    service.registerProvider({
      isApplicable: target => target.nodeType === 'cloud-file',
      getInfo: () => ({ type: 'file' }),
      deleteNode,
    });
    const selected = [node('file', 'cloud-file')];

    expect(service.canDelete(selected)).toBe(true);
    await service.delete(selected);

    expect(deleteNode).toHaveBeenCalledExactlyOnceWith(selected[0]);
    expect(notifications.logError).not.toHaveBeenCalled();
    expect(notifications.logException).not.toHaveBeenCalled();
  });

  it('reactively updates availability when a provider is registered', () => {
    const { service, owner } = setup();
    const selected = [node('file', 'cloud-file')];
    const changed = vi.fn();
    const dispose = reaction(() => service.canDelete(selected), changed, { fireImmediately: true });
    try {
      expect(changed.mock.calls.map(([value]) => value)).toEqual([false]);

      service.registerProvider({ ...owner, isApplicable: target => target.nodeType === 'cloud-file' });

      expect(changed.mock.calls.map(([value]) => value)).toEqual([false, true]);
    } finally {
      dispose();
    }
  });

  it('reactively resets the busy state after confirmation is cancelled', async () => {
    const { service } = setup(DialogueStateResult.Rejected);
    const changed = vi.fn();
    const dispose = reaction(() => service.isDeleting, changed, { fireImmediately: true });
    try {
      const deletion = service.delete([node('connection')]);
      expect(service.isDeleting).toBe(true);
      // Being busy disables the action, but must not hide an otherwise valid selection.
      expect(service.canDelete([node('connection')])).toBe(true);
      await deletion;

      expect(changed.mock.calls.map(([value]) => value)).toEqual([false, true, false]);
    } finally {
      dispose();
    }
  });

  it('explains excluded projects and deduplicates selected nodes by URI', async () => {
    const { service, owner, dialogs } = setup();
    const connection = node('connection');

    await service.delete([node('project', 'project'), connection, { ...connection }, node('rm-project', 'rm.project')]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => item.id)).toEqual(['project', 'connection', 'rm-project']);
    expect(items.filter(item => item.reason).map(item => item.id)).toEqual(['project', 'rm-project']);
    expect(items[0]?.project).toBe('Project');
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(connection);
  });

  it('does not offer deletion or open a dialog for a project-only selection', async () => {
    const { service, owner, dialogs } = setup();
    const selection = [node('project', 'project'), node('rm-project', 'rm.project')];

    expect(service.canDelete(selection)).toBe(false);
    await service.delete(selection);

    expect(dialogs.open).not.toHaveBeenCalled();
    expect(owner.deleteNode).not.toHaveBeenCalled();
  });

  it('explains unavailable nodes in confirmation without deleting them', async () => {
    const { service, owner, dialogs } = setup();
    const connection = node('connection');
    await service.delete([node('readonly'), connection]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => [item.id, item.reason])).toEqual([
      ['readonly', 'plugin_navigation_tree_delete_unavailable'],
      ['connection', undefined],
    ]);
    expect(owner.getInfo).toHaveBeenCalledTimes(2);
    expect(owner.getInfo).toHaveBeenCalledWith(node('readonly'));
    expect(owner.getInfo).toHaveBeenCalledWith(connection);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(connection);
  });

  it('explains unsupported and hidden nodes without deleting them', async () => {
    const { service, owner, dialogs } = setup();
    const connection = node('connection');

    await service.delete([node('unsupported', 'root'), node('resource-root', 'rm.folder'), connection]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => [item.id, !!item.reason])).toEqual([
      ['unsupported', true],
      ['resource-root', true],
      ['connection', false],
    ]);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(connection);
  });

  it('does not prepare or confirm a selection containing only non-deletable nodes', async () => {
    const { service, owner, dialogs, nodes } = setup();

    await service.delete([node('readonly'), node('unsupported', 'root'), node('resource-root', 'rm.folder')]);

    expect(owner.getInfo).not.toHaveBeenCalled();
    expect(nodes.resolveParents).not.toHaveBeenCalled();
    expect(dialogs.open).not.toHaveBeenCalled();
    expect(owner.deleteNode).not.toHaveBeenCalled();
  });

  it('explains targets rejected during preparation and their dependent parents', async () => {
    const { service, owner, dialogs, nodes } = setup();
    owner.getInfo = target => ({ type: 'connection', reason: target.uri === 'child' ? 'unavailable' : undefined });
    nodes.resolveParents.mockImplementation((uri: string) => Promise.resolve(uri === 'child' ? ['parent'] : []));
    const independent = node('independent');

    await service.delete([node('parent'), node('child'), independent]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => [item.id, item.reason])).toEqual([
      ['parent', 'plugin_navigation_tree_delete_dependent_unavailable'],
      ['child', 'unavailable'],
      ['independent', undefined],
    ]);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(independent);
  });

  it('does not delete a selected parent after excluding a non-deletable child', async () => {
    const { service, owner, dialogs, nodes } = setup();
    nodes.resolveParents.mockImplementation((uri: string) => Promise.resolve(uri === 'readonly' ? ['parent'] : []));
    const independent = node('independent');

    await service.delete([node('parent'), node('readonly'), independent]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.filter(item => !item.reason).map(item => item.id)).toEqual(['independent']);
    expect(items.find(item => item.id === 'parent')?.reason).toBe('plugin_navigation_tree_delete_dependent_unavailable');
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(independent);
  });

  it.each(['Folder', '#root'])('omits the synthetic root from the location while keeping project and folder "%s"', async folderName => {
    const { service, dialogs, nodes } = setup();
    const parents = [ROOT_NODE_PATH, 'project-node', 'folder-node'];
    const names = new Map([
      [ROOT_NODE_PATH, '#root'],
      ['project-node', 'Project'],
      ['folder-node', folderName],
    ]);
    nodes.resolveParents.mockResolvedValue(parents);
    nodes.get.mockImplementation((uri: string) => ({ name: names.get(uri) }));

    await service.delete([node('connection')]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items[0]?.location).toBe(`Project/${folderName}`);
    expect(items[0]).not.toHaveProperty('provider');
    expect(items[0]?.parents).toEqual(parents);
  });

  it('omits the provider technical root without removing equally named folders', async () => {
    const { service, owner, dialogs, nodes } = setup();
    const parents = [ROOT_NODE_PATH, 'provider-root', 'storage', 'folder'];
    const names = new Map([
      [ROOT_NODE_PATH, '#root'],
      ['provider-root', 'internal'],
      ['storage', 'Storage'],
      ['folder', 'internal'],
    ]);
    owner.getInfo = () => ({ type: 'connection', locationRoot: 'provider-root' });
    nodes.resolveParents.mockResolvedValue(parents);
    nodes.get.mockImplementation((uri: string) => ({ name: names.get(uri) }));

    await service.delete([node('connection')]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items[0]?.location).toBe('Storage/internal');
  });

  it('uses the same first matching provider for availability and execution', async () => {
    const { service, owner, dialogs } = setup();
    owner.isDisabled = () => true;
    const alternative = { ...owner, isDisabled: () => false, deleteNode: vi.fn() };
    service.registerProvider(alternative);
    const selected = [node('connection')];

    expect(service.canDelete(selected)).toBe(false);
    await service.delete(selected);

    expect(dialogs.open).not.toHaveBeenCalled();
    expect(owner.deleteNode).not.toHaveBeenCalled();
    expect(alternative.deleteNode).not.toHaveBeenCalled();
  });

  it('does not let another provider hide nodes it does not own', async () => {
    const { service, owner } = setup();
    service.registerProvider({ ...owner, isApplicable: () => false, isHidden: () => true });
    const selected = node('connection');
    expect(service.canDelete([selected])).toBe(true);
    await service.delete([selected]);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(selected);
  });

  it('keeps the owning provider hidden even if a later provider accepts the node', async () => {
    const { service, owner, dialogs } = setup();
    owner.isHidden = () => true;
    service.registerProvider({ ...owner, isHidden: () => false });
    expect(service.canDelete([node('connection')])).toBe(false);
    await service.delete([node('connection')]);
    expect(dialogs.open).not.toHaveBeenCalled();
  });

  it('rechecks eligibility after loading the deletion description', async () => {
    const { service, owner, dialogs } = setup();
    let allowed = true;
    owner.isDisabled = () => !allowed;
    owner.getInfo = () => {
      allowed = false;
      return { type: 'connection' };
    };
    const selected = [node('connection')];
    expect(service.canDelete(selected)).toBe(true);

    await service.delete(selected);

    expect(dialogs.open).not.toHaveBeenCalled();
    expect(owner.deleteNode).not.toHaveBeenCalled();
  });

  it('does not execute any plugin operations when confirmation is cancelled', async () => {
    const { service, owner, dialogs, notifications } = setup(DialogueStateResult.Rejected);

    await service.delete([node('a'), node('b')]);

    expect(dialogs.open).toHaveBeenCalledTimes(1);
    expect(owner.deleteNode).not.toHaveBeenCalled();
    expect(notifications.logSuccess).not.toHaveBeenCalled();
    expect(notifications.logError).not.toHaveBeenCalled();
  });

  it('deletes only confirmed IDs and reports the confirmed count', async () => {
    const { service, owner, dialogs, localization } = setup();
    dialogs.open.mockResolvedValue({ status: DialogueStateResult.Resolved, result: ['b', 'readonly', 'unknown'] });
    await service.delete([node('a'), node('b'), node('readonly')]);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(node('b'));
    expect(localization.translate).toHaveBeenCalledWith('plugin_navigation_tree_delete_result', undefined, { count: 1, total: 1 });
  });

  it('does not delete or report success for an empty confirmation', async () => {
    const { service, owner, dialogs, notifications } = setup();
    dialogs.open.mockResolvedValue({ status: DialogueStateResult.Resolved, result: [] });
    await service.delete([node('a')]);
    expect(owner.deleteNode).not.toHaveBeenCalled();
    expect(notifications.logSuccess).not.toHaveBeenCalled();
  });

  it('protects an unchecked child from deletion through its parent', async () => {
    const { service, owner, dialogs, nodes } = setup();
    nodes.resolveParents.mockImplementation((uri: string) => Promise.resolve(uri === 'child' ? ['parent'] : []));
    dialogs.open.mockResolvedValue({ status: DialogueStateResult.Resolved, result: ['parent', 'independent'] });
    await service.delete([node('parent'), node('child'), node('independent')]);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(node('independent'));
  });

  it('ignores repeated activation while confirmation is pending', async () => {
    const { service, owner, dialogs } = setup();
    let confirm!: (value: { status: DialogueStateResult; result: string[] }) => void;
    dialogs.open.mockReturnValue(
      new Promise(resolve => {
        confirm = resolve;
      }),
    );

    const first = service.delete([node('a')]);
    await vi.waitFor(() => expect(dialogs.open).toHaveBeenCalledTimes(1));
    await service.delete([node('b')]);
    expect(owner.deleteNode).not.toHaveBeenCalled();
    confirm({ status: DialogueStateResult.Resolved, result: ['a'] });
    await first;

    expect(dialogs.open).toHaveBeenCalledTimes(1);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(node('a'));
  });

  it('reports partial failure once and continues deleting independent targets', async () => {
    const { service, owner, notifications, localization } = setup();
    owner.deleteNode = vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(true);

    await service.delete([node('a'), node('b')]);

    expect(owner.deleteNode).toHaveBeenCalledTimes(2);
    expect(notifications.logError).toHaveBeenCalledExactlyOnceWith({
      title: 'plugin_navigation_tree_delete_partial',
      message: 'plugin_navigation_tree_delete_result\nProject / a: Denied',
    });
    expect(localization.translate).toHaveBeenCalledWith('plugin_navigation_tree_delete_result', undefined, { count: 1, total: 2 });
    expect(notifications.logSuccess).not.toHaveBeenCalled();
    expect(service.isDeleting).toBe(false);
  });

  it('reports an uncertain batch once, without attributing its error to individual nodes', async () => {
    const { service, owner, notifications, localization } = setup();
    const deleteBatch = vi.fn().mockRejectedValue(new Error('Second node failed'));
    service.registerProvider({
      isApplicable: target => target.nodeType === 'database',
      getInfo: () => ({ type: 'object' }),
      deleteBatch,
    });
    await service.delete([node('a', 'database'), node('b', 'database'), node('independent')]);
    expect(deleteBatch).toHaveBeenCalledTimes(1);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(node('independent'));
    expect(notifications.logError).toHaveBeenCalledExactlyOnceWith({
      title: 'plugin_navigation_tree_delete_partial',
      message: 'plugin_navigation_tree_delete_result_confirmed\nProject / a, Project / b: plugin_navigation_tree_delete_unknown\nSecond node failed',
    });
    expect(localization.translate).toHaveBeenCalledWith('plugin_navigation_tree_delete_result_confirmed', undefined, { count: 1, total: 3 });
    expect(notifications.logSuccess).not.toHaveBeenCalled();
  });

  it('notifies when all selected objects were deleted', async () => {
    const { service, notifications, localization } = setup();

    await service.delete([node('a'), node('b')]);

    expect(notifications.logSuccess).toHaveBeenCalledExactlyOnceWith({
      title: 'plugin_navigation_tree_delete_success',
      message: 'plugin_navigation_tree_delete_result',
    });
    expect(localization.translate).toHaveBeenCalledWith('plugin_navigation_tree_delete_result', undefined, { count: 2, total: 2 });
    expect(notifications.logError).not.toHaveBeenCalled();
  });

  it('reports completion for the confirmed deletable objects', async () => {
    const { service, notifications, localization } = setup();

    await service.delete([node('a'), node('readonly')]);

    expect(notifications.logSuccess).toHaveBeenCalledExactlyOnceWith({
      title: 'plugin_navigation_tree_delete_success',
      message: 'plugin_navigation_tree_delete_result',
    });
    expect(localization.translate).toHaveBeenCalledWith('plugin_navigation_tree_delete_result', undefined, { count: 1, total: 1 });
    expect(notifications.logError).not.toHaveBeenCalled();
  });

  it('does not report success when every deletion fails', async () => {
    const { service, owner, notifications, localization } = setup();
    owner.deleteNode = vi.fn().mockRejectedValue(new Error('Denied'));

    await service.delete([node('a'), node('b')]);

    expect(notifications.logSuccess).not.toHaveBeenCalled();
    expect(notifications.logError).toHaveBeenCalledExactlyOnceWith({
      title: 'plugin_navigation_tree_delete_incomplete',
      message: 'plugin_navigation_tree_delete_result\nProject / a: Denied\nProject / b: Denied',
    });
    expect(localization.translate).toHaveBeenCalledWith('plugin_navigation_tree_delete_result', undefined, { count: 0, total: 2 });
  });

  it('shows the provider explanation for disabled objects', async () => {
    const { service, owner, dialogs } = setup();
    owner.getInfo = target => ({
      type: 'connection',
      readOnly: target.uri === 'readonly',
      reason: target.uri === 'readonly' ? 'read-only-connection' : undefined,
    });

    await service.delete([node('readonly'), node('a')]);

    const items: INodeDeletionDialogItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items[0]?.reason).toBe('read-only-connection');
    expect(items[0]?.readOnly).toBe(true);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(node('a'));
  });
});
