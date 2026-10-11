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
import { ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';

import type { INodeDeletionItem, INodeDeletionProvider } from './NodeDeletionPlan.js';
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
  const dialogs = { open: vi.fn().mockResolvedValue({ status }) };
  const notifications = { logError: vi.fn(), logException: vi.fn() };
  const localization = { translate: (token: string) => token };
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
  return { service, owner, dialogs, notifications, nodes };
}

describe('NodeDeletionService', () => {
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

  it('excludes projects entirely and deduplicates selected nodes by URI', async () => {
    const { service, owner, dialogs } = setup();
    const connection = node('connection');

    await service.delete([node('project', 'project'), connection, { ...connection }, node('rm-project', 'rm.project')]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => item.node.uri)).toEqual(['connection']);
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

  it('omits unavailable nodes from confirmation and deletion', async () => {
    const { service, owner, dialogs } = setup();
    const connection = node('connection');
    await service.delete([node('readonly'), connection]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => item.node.uri)).toEqual(['connection']);
    expect(owner.getInfo).toHaveBeenCalledExactlyOnceWith(connection);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(connection);
  });

  it('omits unsupported and hidden nodes from confirmation and deletion', async () => {
    const { service, owner, dialogs } = setup();
    const connection = node('connection');

    await service.delete([node('unsupported', 'root'), node('resource-root', 'rm.folder'), connection]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => item.node.uri)).toEqual(['connection']);
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

  it('excludes targets rejected during preparation and their dependent parents', async () => {
    const { service, owner, dialogs, nodes } = setup();
    owner.getInfo = target => ({ type: 'connection', reason: target.uri === 'child' ? 'unavailable' : undefined });
    nodes.resolveParents.mockImplementation((uri: string) => Promise.resolve(uri === 'child' ? ['parent'] : []));
    const independent = node('independent');

    await service.delete([node('parent'), node('child'), independent]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => item.node.uri)).toEqual(['independent']);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(independent);
  });

  it('does not delete a selected parent after excluding a non-deletable child', async () => {
    const { service, owner, dialogs, nodes } = setup();
    nodes.getParents.mockImplementation((uri: string) => (uri === 'readonly' ? ['parent'] : []));
    const independent = node('independent');

    await service.delete([node('parent'), node('readonly'), independent]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items.map(item => item.node.uri)).toEqual(['independent']);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(independent);
  });

  it.each(['Folder', '#root'])('omits the synthetic root from the location while keeping project and folder "%s"', async folderName => {
    const { service, dialogs, nodes } = setup();
    const ancestors = [ROOT_NODE_PATH, 'project-node', 'folder-node'];
    const names = new Map([
      [ROOT_NODE_PATH, '#root'],
      ['project-node', 'Project'],
      ['folder-node', folderName],
    ]);
    nodes.resolveParents.mockResolvedValue(ancestors);
    nodes.get.mockImplementation((uri: string) => ({ name: names.get(uri) }));

    await service.delete([node('connection')]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items[0]?.location).toBe(`Project/${folderName}`);
    expect(items[0]?.ancestors).toEqual(ancestors);
  });

  it('omits the provider technical root without removing equally named folders', async () => {
    const { service, owner, dialogs, nodes } = setup();
    const ancestors = [ROOT_NODE_PATH, 'provider-root', 'storage', 'folder'];
    const names = new Map([
      [ROOT_NODE_PATH, '#root'],
      ['provider-root', 'internal'],
      ['storage', 'Storage'],
      ['folder', 'internal'],
    ]);
    owner.getInfo = () => ({ type: 'connection', locationRoot: 'provider-root' });
    nodes.resolveParents.mockResolvedValue(ancestors);
    nodes.get.mockImplementation((uri: string) => ({ name: names.get(uri) }));

    await service.delete([node('connection')]);

    const items: INodeDeletionItem[] = dialogs.open.mock.calls[0]![1].items;
    expect(items[0]?.location).toBe('Storage/internal');
    expect(items[0]?.ancestors).toEqual(ancestors);
  });

  it('honors hidden nodes even when another provider could delete them', async () => {
    const { service, owner, dialogs } = setup();
    service.registerProvider({ ...owner, isHidden: () => true });
    const selected = [node('connection')];

    expect(service.canDelete(selected)).toBe(false);
    await service.delete(selected);

    expect(dialogs.open).not.toHaveBeenCalled();
    expect(owner.deleteNode).not.toHaveBeenCalled();
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
    const { service, owner, dialogs } = setup(DialogueStateResult.Rejected);

    await service.delete([node('a'), node('b')]);

    expect(dialogs.open).toHaveBeenCalledTimes(1);
    expect(owner.deleteNode).not.toHaveBeenCalled();
  });

  it('ignores repeated activation while confirmation is pending', async () => {
    const { service, owner, dialogs } = setup();
    let confirm!: (value: { status: DialogueStateResult }) => void;
    dialogs.open.mockReturnValue(
      new Promise(resolve => {
        confirm = resolve;
      }),
    );

    const first = service.delete([node('a')]);
    await vi.waitFor(() => expect(dialogs.open).toHaveBeenCalledTimes(1));
    await service.delete([node('b')]);
    expect(owner.deleteNode).not.toHaveBeenCalled();
    confirm({ status: DialogueStateResult.Resolved });
    await first;

    expect(dialogs.open).toHaveBeenCalledTimes(1);
    expect(owner.deleteNode).toHaveBeenCalledExactlyOnceWith(node('a'));
  });

  it('reports partial failure once and continues deleting independent targets', async () => {
    const { service, owner, notifications } = setup();
    owner.deleteNode = vi.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValue(true);

    await service.delete([node('a'), node('b')]);

    expect(owner.deleteNode).toHaveBeenCalledTimes(2);
    expect(notifications.logError).toHaveBeenCalledExactlyOnceWith({
      title: 'plugin_navigation_tree_delete_incomplete',
      message: 'Project / a: Denied',
    });
    expect(service.isDeleting).toBe(false);
  });
});
