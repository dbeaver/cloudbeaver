/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { DataContext } from '@cloudbeaver/core-data-context';
import { DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_NAV_NODES, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { ACTION_DELETE, ACTION_RENAME, ActionService, DATA_CONTEXT_MENU } from '@cloudbeaver/core-view';

import { MENU_NAVIGATION_TREE_MANAGE } from '../NavigationTree/ElementsTree/NavigationTreeNode/TreeNodeMenu/MENU_NAVIGATION_TREE_MANAGE.js';
import { NavNodeContextMenuService } from './NavNodeContextMenuService.js';

type Dependencies = ConstructorParameters<typeof NavNodeContextMenuService>;

function node(uri: string): NavNode {
  return { uri, name: uri, folder: false, hasChildren: false, inline: false, navigable: true, filtered: false, objectFeatures: [] };
}

function setup() {
  const actions = new ActionService({} as ConstructorParameters<typeof ActionService>[0]);
  const deletion = {
    isDeleting: false,
    registerProvider: vi.fn(),
    canDelete: vi.fn().mockReturnValue(true),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  const dialogs = { open: vi.fn() };
  const resource = { deleteNode: vi.fn() };
  const service = new NavNodeContextMenuService(
    {} as Dependencies[0],
    {} as Dependencies[1],
    dialogs as unknown as Dependencies[2],
    resource as unknown as Dependencies[3],
    actions,
    { setHandler: vi.fn(), addCreator: vi.fn() } as unknown as Dependencies[5],
    {} as Dependencies[6],
    {} as Dependencies[7],
    {} as Dependencies[8],
    deletion as unknown as Dependencies[9],
  );
  service.register();
  const context = new DataContext();
  context.set(DATA_CONTEXT_MENU, MENU_NAVIGATION_TREE_MANAGE, 'test');
  return { actions, deletion, dialogs, resource, context };
}

describe('Manage menu deletion', () => {
  it('does not check or execute deletion for another action', async () => {
    const { actions, deletion, context } = setup();
    context.set(DATA_CONTEXT_NAV_NODE, node('node://project/datasources/connection/table'), 'test');
    const handler = actions.getHandler(context, ACTION_DELETE)!;

    expect(handler.isHidden?.(context, ACTION_RENAME)).toBe(true);
    expect(handler.isDisabled?.(context, ACTION_RENAME)).toBe(true);
    await handler.handler(context, ACTION_RENAME);

    expect(deletion.canDelete).not.toHaveBeenCalled();
    expect(deletion.delete).not.toHaveBeenCalled();
  });

  it('routes a single node without a selection context through the common confirmation service', async () => {
    const { actions, deletion, dialogs, resource, context } = setup();
    const selected = node('node://project/datasources/connection/table');
    context.set(DATA_CONTEXT_NAV_NODE, selected, 'test');

    const handler = actions.getHandler(context, ACTION_DELETE);
    expect(handler).not.toBeNull();
    await handler!.handler(context, ACTION_DELETE);

    expect(deletion.delete).toHaveBeenCalledExactlyOnceWith([selected]);
    expect(dialogs.open).not.toHaveBeenCalled();
    expect(resource.deleteNode).not.toHaveBeenCalled();
  });

  it('routes a mixed selection through the same handler and uses its availability check', async () => {
    const { actions, deletion, context } = setup();
    const selected = [node('node://project-a/folder'), node('node://project-b/datasources/connection')];
    context.set(DATA_CONTEXT_NAV_NODE, selected[0]!, 'test');
    context.set(DATA_CONTEXT_NAV_NODES, () => selected, 'test');
    const handler = actions.getHandler(context, ACTION_DELETE)!;

    expect(handler.isHidden?.(context, ACTION_DELETE)).toBe(false);
    expect(handler.isDisabled?.(context, ACTION_DELETE)).toBe(false);
    expect(deletion.canDelete).toHaveBeenCalledWith(selected);
    await handler.handler(context, ACTION_DELETE);
    expect(deletion.delete).toHaveBeenCalledExactlyOnceWith(selected);

    deletion.canDelete.mockReturnValue(false);
    expect(handler.isHidden?.(context, ACTION_DELETE)).toBe(true);
    expect(handler.isDisabled?.(context, ACTION_DELETE)).toBe(true);
  });

  it('hides Delete rather than disabling it when none of the selected nodes can be deleted', () => {
    const { actions, deletion, context } = setup();
    context.set(DATA_CONTEXT_NAV_NODE, { ...node('node://project'), nodeType: 'project' }, 'test');
    deletion.canDelete.mockReturnValue(false);

    const handler = actions.getHandler(context, ACTION_DELETE)!;

    expect(handler.isHidden?.(context, ACTION_DELETE)).toBe(true);
  });

  it('keeps Delete visible but disabled while another deletion is running', () => {
    const { actions, deletion, context } = setup();
    context.set(DATA_CONTEXT_NAV_NODE, node('node://project/datasources/connection'), 'test');
    deletion.isDeleting = true;

    const handler = actions.getHandler(context, ACTION_DELETE)!;

    expect(handler.isHidden?.(context, ACTION_DELETE)).toBe(false);
    expect(handler.isDisabled?.(context, ACTION_DELETE)).toBe(true);
  });
});
