/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { DataContext } from '@cloudbeaver/core-data-context';
import { ACTION_COLLAPSE_ALL, ActionService, KeyBindingService, MenuService } from '@cloudbeaver/core-view';

import { KEY_BINDING_COLLAPSE_ALL } from '../NavigationTree/ElementsTree/KEY_BINDING_COLLAPSE_ALL.js';
import { DATA_CONTEXT_TREE_DATA } from './DATA_CONTEXT_TREE.js';
import type { ITreeData } from './ITreeData.js';
import { TreeToolbarMenuService } from './TreeToolbarMenuService.js';

function setup() {
  const keyBindingService = new KeyBindingService();
  const actionService = new ActionService(keyBindingService);
  const menuService = new MenuService(actionService);
  new TreeToolbarMenuService(actionService, menuService, keyBindingService).register();

  const states = [
    { selected: false, expanded: true },
    { selected: true, expanded: true },
  ];

  const tree: ITreeData = {
    rootId: 'root',
    getNode: id => ({ name: id }),
    getChildren: id => {
      if (id === 'root') {
        return ['0'];
      }

      return id === '0' ? ['1'] : [];
    },
    getUnfilteredChildren: id => tree.getChildren(id),
    getParent: id => (id === '0' ? 'root' : '0'),
    getState: id => states[Number(id)]!,
    updateAllState: state => states.forEach(node => Object.assign(node, state)),
    updateState: (id, state) => Object.assign(states[Number(id)]!, state),
    load: async () => {},
    update: async () => {},
  };

  const context = new DataContext();
  context.set(DATA_CONTEXT_TREE_DATA, tree, 'test');

  return { actionService, keyBindingService, context, states };
}

describe('TreeToolbarMenuService collapse shortcut', () => {
  it('collapses every level from the view context without a toolbar menu and preserves selection', () => {
    const { actionService, context, states } = setup();
    const action = actionService.getAction(context, ACTION_COLLAPSE_ALL);

    expect(action?.binding?.binding).toBe(KEY_BINDING_COLLAPSE_ALL);
    action?.activate(true);

    expect(states).toEqual([
      { selected: false, expanded: false },
      { selected: true, expanded: false },
    ]);

    expect(actionService.getAction(context, ACTION_COLLAPSE_ALL)).toBeNull();
  });

  it('does not offer the action or shortcut outside a new tree', () => {
    const { actionService, keyBindingService } = setup();
    const context = new DataContext();

    expect(actionService.getAction(context, ACTION_COLLAPSE_ALL)).toBeNull();
    expect(keyBindingService.getKeyBindingHandler(context, ACTION_COLLAPSE_ALL)).toBeNull();
  });
});
