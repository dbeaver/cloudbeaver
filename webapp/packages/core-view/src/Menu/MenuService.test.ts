/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import { createDataContext } from '@cloudbeaver/core-data-context';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { ActionService } from '../Action/ActionService.js';
import { KeyBindingService } from '../Action/KeyBinding/KeyBindingService.js';
import { createAction } from '../Action/createAction.js';
import { createMenu } from './createMenu.js';
import { createMenuContext, MenuModel } from './MenuModel.js';
import { MenuService } from './MenuService.js';

describe('MenuService preparation', () => {
  it('discovers preparation before resource-dependent applicability', async () => {
    const menuService = new MenuService(new ActionService(new KeyBindingService()));
    const menu = createMenu('manage', { label: 'manage' });
    const state = observable({ loaded: false });
    const applicable = vi.fn(() => state.loaded);
    const loader: ILoadableState = {
      isLoaded: () => state.loaded,
      isLoading: () => false,
      isError: () => false,
      load: () => {
        runInAction(() => {
          state.loaded = true;
        });
      },
    };
    menuService.addCreator({ menus: [menu], getPreparationLoader: () => loader, isApplicable: applicable, getItems: (_, items) => items });
    const model = new MenuModel(menuService, menu);
    const stop = model.start();
    expect(applicable).not.toHaveBeenCalled();
    await model.load();
    expect(model.state).toBe('ready');
    expect(applicable).toHaveBeenCalled();
    stop();
  });

  it('does not call a preparation factory for a different menu or missing context', () => {
    const menuService = new MenuService(new ActionService(new KeyBindingService()));
    const menu = createMenu('manage', { label: 'manage' });
    const required = createDataContext<string>('required');
    const prepare = vi.fn(() => []);
    menuService.addCreator({ menus: [menu], contexts: [required], getPreparationLoader: prepare, getItems: (_, items) => items });
    expect(menuService.getPreparationLoaders(createMenuContext(menu))).toEqual([]);
    const otherContext = createMenuContext(createMenu('other', { label: 'other' })).set(required, 'value', 'test');
    expect(menuService.getPreparationLoaders(otherContext)).toEqual([]);
    expect(prepare).not.toHaveBeenCalled();
  });

  it.each([
    { name: 'anonymous shared', edit: false, view: false, remove: false, hidden: true },
    { name: 'non-admin shared', edit: false, view: false, remove: false, hidden: true },
    { name: 'non-admin private', edit: true, view: false, remove: true, hidden: false },
    { name: 'view settings', edit: false, view: true, remove: false, hidden: false },
    { name: 'admin', edit: true, view: true, remove: true, hidden: false },
  ])('preserves object permissions for $name', ({ edit, view, remove, hidden }) => {
    const actionService = new ActionService(new KeyBindingService());
    const menuService = new MenuService(actionService);
    const menu = createMenu('manage', { label: 'manage' });
    const editAction = createAction('edit', { label: 'edit' });
    const deleteAction = createAction('delete', { label: 'delete' });
    actionService.addHandler({ id: 'edit', menus: [menu], actions: [editAction], isHidden: () => !(edit || view), handler: () => {} });
    actionService.addHandler({ id: 'delete', menus: [menu], actions: [deleteAction], isHidden: () => !remove, handler: () => {} });
    menuService.addCreator({ menus: [menu], getItems: () => [editAction, deleteAction] });
    const model = new MenuModel(menuService, menu);
    const stop = model.start();
    expect(model.hidden).toBe(hidden);
    stop();
  });
});
