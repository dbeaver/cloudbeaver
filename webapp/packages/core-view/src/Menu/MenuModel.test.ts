/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { describe, expect, it, vi } from 'vitest';

import type { ILoadableState } from '@cloudbeaver/core-utils';
import { createDataContext, DataContext } from '@cloudbeaver/core-data-context';

import { DATA_CONTEXT_MENU } from './DATA_CONTEXT_MENU.js';
import { DATA_CONTEXT_MENU_NESTED } from './DATA_CONTEXT_MENU_NESTED.js';
import { MenuModel } from './MenuModel.js';
import type { IMenu } from './IMenu.js';
import { MenuSubMenuItem } from './MenuItem/MenuSubMenuItem.js';
import { MenuSeparatorItem } from './MenuItem/MenuSeparatorItem.js';
import { MenuBaseItem } from './MenuItem/MenuBaseItem.js';

const rootMenu: IMenu = { id: 'root', info: { label: 'root' } };
const childMenu: IMenu = { id: 'child', info: { label: 'child' } };

function resource(lazy = false) {
  const state = observable({ loaded: false, loading: false, outdated: false, error: null as Error | null });
  const loader: ILoadableState = {
    lazy,
    get exception() {
      return state.error;
    },
    isLoaded: () => state.loaded,
    isLoading: () => state.loading,
    isOutdated: () => state.outdated,
    isError: () => !!state.error,
    load: vi.fn(async () => {
      runInAction(() => {
        state.loading = true;
      });
      await Promise.resolve();
      runInAction(() => {
        state.loaded = true;
        state.loading = false;
        state.outdated = false;
      });
    }),
  };
  return { state, loader };
}

function service(overrides: Partial<ConstructorParameters<typeof MenuModel>[0]> = {}): ConstructorParameters<typeof MenuModel>[0] {
  return {
    getHandler: () => null,
    getPreparationLoaders: () => [],
    getMenuItemCreators: () => [],
    getMenuItemLoaders: () => [],
    getMenu: () => [],
    createActionItem: () => null,
    ...overrides,
  };
}

describe('MenuModel', () => {
  it('skips a queued target after its inputs change and loads the new target', async () => {
    const gate = resource();
    let release!: () => void;
    gate.loader.load = async () => {
      await new Promise<void>(resolve => {
        release = resolve;
      });
      runInAction(() => {
        gate.state.loaded = true;
      });
    };
    const key = observable.box('first');
    const loaded = observable.set<string>();
    const loadKey = vi.fn((target: string) => {
      runInAction(() => {
        loaded.add(target);
      });
    });
    const loader: ILoadableState = {
      isLoaded: () => loaded.has(key.get()),
      isLoading: () => false,
      isError: () => false,
      load: () => loadKey(key.get()),
      captureRequest() {
        const target = key.get();
        return {
          state: { ...loader, load: () => loadKey(target), isLoaded: () => loaded.has(target) },
          isCurrent: () => key.get() === target,
        };
      },
    };
    const model = new MenuModel(service({ getPreparationLoaders: () => [gate.loader, loader] }), rootMenu);
    const stop = model.start();
    const loading = model.load();
    runInAction(() => key.set('second'));
    release();
    await loading;
    await model.load();
    expect(loadKey).toHaveBeenCalledExactlyOnceWith('second');
    expect(model.isLoaded()).toBe(true);
    stop();
  });

  it('keeps a current failure when unrelated local or parent context values change', async () => {
    const unrelated = createDataContext<string>('unrelated');
    const parent = new DataContext();
    const context = new DataContext(parent);
    const failure = new Error('current request failed');
    let reject!: (error: Error) => void;
    const loader = resource().loader;
    loader.load = vi.fn(
      () =>
        new Promise<void>((_, rejectLoad) => {
          reject = rejectLoad;
        }),
    );
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader] }), rootMenu, context);
    const stop = model.start();
    const loading = model.load();
    context.set(unrelated, 'local change', 'owner');
    parent.set(unrelated, 'parent change', 'owner');
    reject(failure);
    await loading;
    expect(model.exception).toBe(failure);
    context.set(unrelated, 'another local change', 'owner');
    parent.set(unrelated, 'another parent change', 'owner');
    await model.load();
    expect(model.exception).toBe(failure);
    expect(loader.load).toHaveBeenCalledOnce();
    stop();
  });

  it('keeps a cached lazy child error inside the child menu', () => {
    const content = resource(true);
    const failure = new Error('lazy child failed');
    content.state.error = failure;
    const item = new MenuSubMenuItem({ menu: childMenu });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [item] : []),
        getMenuItemLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [content.loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    const child = model.getSubMenu(item)!;
    child.setOpen(true);
    expect(child.exception).toBe(failure);
    expect(child.isError()).toBe(true);
    expect(model.exception).toBeNull();
    expect(model.isError()).toBe(false);
    expect(model.isLoaded()).toBe(true);
    expect(model.visibleItems).toEqual([item]);
    stop();
  });

  it('isolates rejected lazy child requests without blocking another child or retrying automatically', async () => {
    const content = resource(true);
    content.loader.load = vi.fn(() => Promise.reject(new Error('lazy request rejected')));
    const otherContent = resource(true);
    const otherMenu: IMenu = { id: 'other', info: { label: 'other' } };
    const item = new MenuSubMenuItem({ menu: childMenu });
    const other = new MenuSubMenuItem({ menu: otherMenu });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [item, other] : []),
        getMenuItemLoaders: context => {
          const menu = context.getOwn(DATA_CONTEXT_MENU);
          if (menu === childMenu) {
            return [content.loader];
          }
          return menu === otherMenu ? [otherContent.loader] : [];
        },
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    const child = model.getSubMenu(item)!;
    child.setOpen(true);
    await model.load();
    expect(child.isError()).toBe(true);
    expect(model.isError()).toBe(false);
    expect(model.isLoaded()).toBe(true);
    model.getSubMenu(other)!.setOpen(true);
    await model.load();
    expect(content.loader.load).toHaveBeenCalledOnce();
    expect(otherContent.loader.load).toHaveBeenCalledOnce();
    expect(child.isError()).toBe(true);
    stop();
  });

  it('exposes a cached child failure to its parent and retries it', async () => {
    const content = resource();
    const failure = new Error('cached child failure');
    content.state.error = failure;
    content.loader.reload = async () => {
      runInAction(() => {
        content.state.error = null;
      });
      await content.loader.load();
    };
    const child = new MenuSubMenuItem({ menu: childMenu });
    const available = new MenuBaseItem({ id: 'available', label: 'available' });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [available, child] : []),
        getMenuItemLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [content.loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    await model.load();
    expect(model.isLoaded()).toBe(false);
    expect(model.isError()).toBe(true);
    expect(model.exception).toBe(failure);
    expect(content.loader.load).not.toHaveBeenCalled();
    await model.reload();
    expect(model.isError()).toBe(false);
    expect(model.isLoaded()).toBe(true);
    expect(model.visibleItems).toEqual([available]);
    stop();
  });

  it('waits for child availability before presenting an open menu', async () => {
    const preparation = resource();
    const item = new MenuSubMenuItem({ menu: childMenu });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [item] : []),
        getPreparationLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [preparation.loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    expect(model.isLoaded()).toBe(true);
    model.setOpen(true);
    expect(model.visibleItems).toEqual([item]);
    expect(model.isLoaded()).toBe(false);
    await model.load();
    expect(model.isLoaded()).toBe(true);
    expect(model.empty).toBe(true);
    stop();
  });

  it('waits for child non-lazy content without waiting for its unopened descendants', async () => {
    const content = resource();
    const descendant = resource();
    const grandchildMenu: IMenu = { id: 'grandchild', info: { label: 'grandchild' } };
    const child = new MenuSubMenuItem({ menu: childMenu });
    const grandchild = new MenuSubMenuItem({ menu: grandchildMenu });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [child] : [grandchild]),
        getMenuItemLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [content.loader] : []),
        getPreparationLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === grandchildMenu ? [descendant.loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    expect(model.isLoaded()).toBe(false);
    await model.load();
    expect(model.isLoaded()).toBe(true);
    expect(descendant.loader.load).not.toHaveBeenCalled();
    model.getSubMenu(child)!.setOpen(true);
    expect(model.getSubMenu(child)!.isLoaded()).toBe(false);
    expect(model.isLoaded()).toBe(true);
    await model.load();
    expect(model.getSubMenu(child)!.isLoaded()).toBe(true);
    stop();
  });

  it('keeps the parent presentable while a child loads its lazy content', async () => {
    const content = resource(true);
    const item = new MenuSubMenuItem({ menu: childMenu });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [item] : []),
        getMenuItemLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [content.loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    const child = model.getSubMenu(item)!;
    expect(model.isLoaded()).toBe(true);
    child.setOpen(true);
    expect(child.isLoaded()).toBe(false);
    expect(model.isLoaded()).toBe(true);
    const loading = model.load();
    expect(child.isLoading()).toBe(true);
    expect(model.isLoaded()).toBe(true);
    await loading;
    expect(child.isLoaded()).toBe(true);
    stop();
  });

  it('does not wait for content of a hidden child', async () => {
    const content = resource();
    const item = new MenuSubMenuItem({ menu: childMenu });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [item] : []),
        getHandler: context =>
          context.getOwn(DATA_CONTEXT_MENU) === childMenu ? { id: 'hidden', menus: new Set(), contexts: new Set(), isHidden: () => true } : null,
        getMenuItemLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [content.loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    await model.load();
    expect(model.isLoaded()).toBe(true);
    expect(model.empty).toBe(true);
    expect(content.loader.load).not.toHaveBeenCalled();
    stop();
  });

  it('removes a failure after its dynamic submenu leaves the active menu', async () => {
    const { loader } = resource();
    loader.load = () => Promise.reject(new Error('removed child failed'));
    const showChild = observable.box(true);
    const item = new MenuSubMenuItem({ menu: childMenu });
    const action = new MenuBaseItem({ id: 'available', label: 'available' });
    const model = new MenuModel(
      service({
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [action, ...(showChild.get() ? [item] : [])] : []),
        getPreparationLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [loader] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    await model.load();
    expect(model.isError()).toBe(true);
    runInAction(() => showChild.set(false));
    expect(model.exception).toBeNull();
    expect(model.visibleItems).toEqual([action]);
    expect(model.state).toBe('ready');
    stop();
  });

  it('removes consecutive separators at both ends while keeping one between content', () => {
    const first = new MenuBaseItem({ id: 'first', label: 'first' });
    const second = new MenuBaseItem({ id: 'second', label: 'second' });
    const separator = () => new MenuSeparatorItem();
    const model = new MenuModel(
      service({ getMenu: () => [separator(), separator(), first, separator(), separator(), second, separator(), separator()] }),
      rootMenu,
    );
    const stop = model.start();
    expect(model.visibleItems).toEqual([first, expect.any(MenuSeparatorItem), second]);
    stop();
  });

  it('keeps blocked loaders pending without retrying them in a loop', async () => {
    const { loader } = resource();
    loader.isLoadable = () => false;
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader] }), rootMenu);
    const stop = model.start();
    await model.load();
    expect(loader.load).not.toHaveBeenCalled();
    expect(model.state).toBe('pending');
    expect(model.hidden).toBe(false);
    stop();
  });

  it('ignores an old request failure after the context switches to a different object', async () => {
    const key = createDataContext<string>('connection');
    let reject!: (error: Error) => void;
    const loader = resource().loader;
    loader.load = () =>
      new Promise<void>((_, rejectLoad) => {
        reject = rejectLoad;
      });
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader] }), rootMenu);
    loader.captureRequest = () => {
      const connection = model.context.get(key);
      return { state: loader, isCurrent: () => model.context.get(key) === connection };
    };
    model.context.set(key, 'first', 'node');
    const stop = model.start();
    const loading = model.load();
    model.context.set(key, 'second', 'node');
    reject(new Error('first connection failed'));
    await loading;
    stop();
    expect(model.exception).toBeNull();
  });

  it('provides menu identity before effects and distinguishes uninitialized from empty', () => {
    const model = new MenuModel(service(), rootMenu);
    expect(model.context.getOwn(DATA_CONTEXT_MENU)).toBe(rootMenu);
    expect(model.state).toBe('pending');
    expect(model.hidden).toBe(false);
    const stop = model.start();
    expect(model.state).toBe('ready');
    expect(model.hidden).toBe(true);
    stop();
  });

  it('loads prerequisites before evaluating availability', async () => {
    const { state, loader } = resource();
    const getItems = vi.fn(() => {
      expect(state.loaded).toBe(true);
      return [];
    });
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader], getMenu: getItems }), rootMenu);
    const stop = model.start();
    expect(model.prepared).toBe(false);
    expect(model.hidden).toBe(false);
    expect(getItems).not.toHaveBeenCalled();
    await model.load();
    expect(model.hidden).toBe(true);
    stop();
  });

  it('keeps lazy content reachable and loads it only after opening', async () => {
    const { loader } = resource(true);
    const model = new MenuModel(service({ getMenuItemLoaders: () => [loader] }), rootMenu);
    const stop = model.start();
    await model.load();
    expect(loader.load).not.toHaveBeenCalled();
    expect(model.hidden).toBe(false);
    model.setOpen(true);
    await model.load();
    expect(loader.load).toHaveBeenCalledOnce();
    expect(model.hidden).toBe(true);
    stop();
  });

  it('prepares a child without mounting its UI and preserves its lazy content', async () => {
    const preparation = resource();
    const content = resource(true);
    const item = new MenuSubMenuItem({ menu: childMenu });
    const model = new MenuModel(
      service({
        getPreparationLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [preparation.loader] : []),
        getMenuItemLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [content.loader] : []),
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [item] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    model.setOpen(true);
    await model.load();
    expect(preparation.loader.load).toHaveBeenCalledOnce();
    expect(content.loader.load).not.toHaveBeenCalled();
    const child = model.getSubMenu(item)!;
    expect(child.context.hasOwn(DATA_CONTEXT_MENU_NESTED)).toBe(true);
    expect(child.hidden).toBe(false);
    child.setOpen(true);
    await model.load();
    expect(content.loader.load).toHaveBeenCalledOnce();
    expect(model.visibleItems).toEqual([]);
    stop();
  });

  it('does not fetch descendants of closed menus', async () => {
    const preparation = resource();
    const model = new MenuModel(
      service({
        getPreparationLoaders: context => (context.getOwn(DATA_CONTEXT_MENU) === childMenu ? [preparation.loader] : []),
        getMenu: context => (context.getOwn(DATA_CONTEXT_MENU) === rootMenu ? [new MenuSubMenuItem({ menu: childMenu })] : []),
      }),
      rootMenu,
    );
    const stop = model.start();
    await model.load();
    expect(preparation.loader.load).not.toHaveBeenCalled();
    stop();
  });

  it('resolves dependencies discovered after the first preparation request', async () => {
    const first = resource();
    const second = resource();
    const model = new MenuModel(service({ getPreparationLoaders: () => (first.state.loaded ? [second.loader] : [first.loader]) }), rootMenu);
    const stop = model.start();
    await model.load();
    await model.load();
    expect(second.loader.load).toHaveBeenCalledOnce();
    expect(model.hidden).toBe(true);
    stop();
  });

  it('reopens availability when cached permissions become outdated', async () => {
    const { state, loader } = resource();
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader] }), rootMenu);
    const stop = model.start();
    await model.load();
    expect(model.hidden).toBe(true);
    runInAction(() => {
      state.outdated = true;
    });
    expect(model.prepared).toBe(false);
    expect(model.hidden).toBe(false);
    await model.load();
    expect(model.hidden).toBe(true);
    stop();
  });

  it('preserves disabled items and custom content, and removes empty separators', () => {
    const disabled = new MenuBaseItem({ id: 'disabled', label: 'disabled', disabled: true });
    const custom = { id: 'custom' };
    const model = new MenuModel(
      service({ getMenu: () => [new MenuSeparatorItem(), disabled, new MenuSeparatorItem(), custom, new MenuSeparatorItem()] }),
      rootMenu,
    );
    const stop = model.start();
    expect(model.visibleItems).toEqual([disabled, expect.any(MenuSeparatorItem), custom]);
    expect(model.empty).toBe(false);
    stop();
  });

  it('prevents recursive menu contributions from causing infinite resolution', () => {
    const model = new MenuModel(service({ getMenu: () => [new MenuSubMenuItem({ menu: rootMenu })] }), rootMenu);
    const stop = model.start();
    expect(model.hidden).toBe(true);
    stop();
  });

  it('keeps failed menus distinct from empty and supports retry', async () => {
    const { state, loader } = resource();
    const failure = new Error('request failed');
    const originalLoad = loader.load;
    loader.load = vi.fn(async () => {
      await Promise.resolve();
      runInAction(() => {
        state.error = failure;
      });
      throw failure;
    });
    loader.reload = async () => {
      runInAction(() => {
        state.error = null;
      });
      await originalLoad();
    };
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader] }), rootMenu);
    const stop = model.start();
    await model.load();
    expect(model.state).toBe('error');
    expect(model.hidden).toBe(false);
    await model.reload();
    expect(model.state).toBe('ready');
    stop();
  });

  it('does not publish failures from a disposed scope', async () => {
    let reject!: (error: Error) => void;
    const loader = resource().loader;
    loader.load = () =>
      new Promise<void>((_, rejectLoad) => {
        reject = rejectLoad;
      });
    const model = new MenuModel(service({ getPreparationLoaders: () => [loader] }), rootMenu);
    const stop = model.start();
    const loading = model.load();
    stop();
    reject(new Error('stale request'));
    await loading;
    expect(model.exception).toBeNull();
  });
});
