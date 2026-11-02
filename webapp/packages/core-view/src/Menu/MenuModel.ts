/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, autorun, computed, makeObservable, observable, runInAction, type IReactionDisposer } from 'mobx';

import { DataContext, type IDataContext } from '@cloudbeaver/core-data-context';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { DATA_CONTEXT_MENU } from './DATA_CONTEXT_MENU.js';
import { DATA_CONTEXT_MENU_NESTED } from './DATA_CONTEXT_MENU_NESTED.js';
import { DATA_CONTEXT_SUBMENU_ITEM } from './DATA_CONTEXT_SUBMENU_ITEM.js';
import { DATA_CONTEXT_LOADABLE_STATE, loadableStateContext } from '../LoadableStateContext/DATA_CONTEXT_LOADABLE_STATE.js';
import type { IMenu } from './IMenu.js';
import type { IMenuHandler } from './IMenuHandler.js';
import type { MenuCreatorItem } from './IMenuItemsCreator.js';
import type { IMenuItem } from './MenuItem/IMenuItem.js';
import type { IMenuActionItem } from './MenuItem/IMenuActionItem.js';
import type { IMenuSubMenuItem } from './MenuItem/IMenuSubMenuItem.js';
import { MenuSeparatorItem } from './MenuItem/MenuSeparatorItem.js';
import { MenuSubMenuItem } from './MenuItem/MenuSubMenuItem.js';
import type { MenuService } from './MenuService.js';

type MenuModelService = Pick<
  MenuService,
  'getHandler' | 'getMenuItemCreators' | 'getMenu' | 'getMenuItemLoaders' | 'getPreparationLoaders' | 'createActionItem'
>;
export type MenuResolutionState = 'pending' | 'loading' | 'ready' | 'error';

interface IMenuLoadRequest {
  loader: ILoadableState;
  context: IDataContext;
  revision: string | undefined;
}

export function createMenuContext(menu: IMenu, parent?: IDataContext, subMenu?: IMenuSubMenuItem): IDataContext {
  const context = new DataContext(parent);
  context.set(DATA_CONTEXT_MENU, menu, 'menu');
  context.set(DATA_CONTEXT_LOADABLE_STATE, loadableStateContext(), 'menu');
  if (subMenu) {
    context.set(DATA_CONTEXT_MENU_NESTED, true, 'menu');
    context.set(DATA_CONTEXT_SUBMENU_ITEM, subMenu, 'menu');
  }
  return context;
}

function pending(loader: ILoadableState): boolean {
  return !loader.isLoaded() || loader.isOutdated?.() === true;
}

/** One menu scope. Its root owns loading even when a submenu has no mounted UI. */
export class MenuModel implements ILoadableState {
  readonly context: IDataContext;
  private readonly children = new WeakMap<IMenuSubMenuItem, MenuModel>();
  private readonly root: MenuModel;
  private initialized = false;
  private open = false;
  private loadLazy = false;
  private failure: { error: Error; loader: ILoadableState; context: IDataContext; revision: string | undefined } | null = null;
  private dispose: IReactionDisposer | undefined;
  private task: Promise<void> | undefined;
  private scheduled = false;
  private rerun = false;
  private retrying = false;
  private generation = 0;

  constructor(
    private readonly menuModelService: MenuModelService,
    readonly menu: IMenu,
    context?: IDataContext,
    readonly filterAction?: IMenuActionItem,
    private readonly parent?: MenuModel,
  ) {
    this.context = context ?? createMenuContext(menu);
    this.root = parent?.root ?? this;
    makeObservable<this, 'initialized' | 'open' | 'loadLazy' | 'failure'>(this, {
      initialized: observable,
      open: observable,
      loadLazy: observable,
      failure: observable.ref,
      handler: computed,
      preparationLoaders: computed,
      prepared: computed,
      itemCreators: computed,
      items: computed,
      loaders: computed,
      visibleItems: computed,
      state: computed,
      empty: computed,
      hidden: computed,
      exception: computed,
      setOpen: action,
    });
  }

  get handler(): IMenuHandler | null {
    return this.prepared ? this.menuModelService.getHandler(this.context) : null;
  }
  get preparationLoaders(): ILoadableState[] {
    return this.menuModelService.getPreparationLoaders(this.context);
  }
  get prepared(): boolean {
    return this.root.initialized && this.preparationLoaders.every(loader => !pending(loader) && !loader.isError());
  }
  get itemCreators(): MenuCreatorItem[] {
    return this.prepared ? this.menuModelService.getMenuItemCreators(this.context) : [];
  }
  get items(): IMenuItem[] {
    return this.prepared ? this.menuModelService.getMenu(this.context, this.itemCreators).filter(item => item !== this.filterAction) : [];
  }
  get loaders(): ILoadableState[] {
    if (!this.prepared) {
      return [];
    }
    return [
      ...this.menuModelService.getMenuItemLoaders(this.context, this.itemCreators),
      ...[this.handler?.getLoader?.(this.context, this.menu) ?? []].flat(),
    ];
  }

  getSubMenu(item: IMenuSubMenuItem): MenuModel | undefined {
    // Root creators or extensions may accidentally insert an ancestor into itself.
    if (this.menu === item.menu) {
      return undefined;
    }
    for (let ancestor = this.parent; ancestor; ancestor = ancestor.parent) {
      if (ancestor.menu === item.menu) {
        return undefined;
      }
    }
    let child = this.children.get(item);
    if (!child) {
      child = new MenuModel(this.menuModelService, item.menu, createMenuContext(item.menu, this.context, item), undefined, this);
      this.children.set(item, child);
    }
    return child;
  }

  get visibleItems(): IMenuItem[] {
    const visible = this.items.filter(item => !item.hidden && (!(item instanceof MenuSubMenuItem) || this.getSubMenu(item)?.hidden === false));
    const result: IMenuItem[] = [];
    let separator: IMenuItem | undefined;
    for (const item of visible) {
      if (item instanceof MenuSeparatorItem) {
        if (result.length > 0) {
          separator = item;
        }
        continue;
      }
      if (separator) {
        result.push(separator);
        separator = undefined;
      }
      result.push(item);
    }
    return result;
  }
  get state(): MenuResolutionState {
    const loaders = [...this.preparationLoaders, ...this.loaders];
    if (this.exception || loaders.some(loader => loader.isError())) {
      return 'error';
    }
    if (loaders.some(loader => loader.isLoading())) {
      return 'loading';
    }
    return this.prepared && loaders.every(loader => !pending(loader)) ? 'ready' : 'pending';
  }
  get empty(): boolean {
    return this.state === 'ready' && this.visibleItems.length === 0;
  }
  get hidden(): boolean {
    if (!this.prepared) {
      return false;
    }
    if (this.handler?.isHidden?.(this.context)) {
      return true;
    }
    const info = this.handler?.getInfo?.(this.context, this.menu);
    const action = info ? info.action : this.menu.info.action;
    const primaryAction = action && this.menuModelService.createActionItem(this.context, action);
    return this.empty && (!primaryAction || primaryAction.hidden === true);
  }
  get exception(): Error | null {
    const failure = this.root.failure;
    if (
      failure &&
      failure.context.revision === failure.revision &&
      this.root.activeRequests().some(request => request.context === failure.context && request.loader === failure.loader)
    ) {
      return failure.error;
    }
    for (const loader of [...this.preparationLoaders, ...this.loaders]) {
      const errors = [loader.exception ?? []].flat();
      const error = errors.find((error): error is Error => !!error);
      if (error) {
        return error;
      }
    }
    return null;
  }

  isLoaded = (): boolean => {
    if (!this.isContentLoaded(this.loadLazy)) {
      return false;
    }
    // Resolve the next level before displaying its entries. Opening a child must
    // not make its parent wait for the child's lazy content or deeper menus.
    return (
      !this.open ||
      this.items.every(item => item.hidden || !(item instanceof MenuSubMenuItem) || this.getSubMenu(item)?.isContentLoaded(false) !== false)
    );
  };
  isLoading = (): boolean => this.state === 'loading';
  isError = (): boolean => this.state === 'error';
  load = (): Promise<void> => this.root.loadPending();
  reload = async (): Promise<void> => {
    this.root.retrying = true;
    try {
      await this.root.task;
      for (const loader of this.activeLoaders()) {
        if (loader.isError() && loader.reload) {
          await loader.reload();
        }
      }
      runInAction(() => {
        this.root.failure = null;
      });
    } finally {
      this.root.retrying = false;
    }
    await this.root.loadPending();
  };

  setOpen(open: boolean, loadLazy = open): void {
    this.open = open;
    this.loadLazy = loadLazy;
  }

  start(): () => void {
    runInAction(() => {
      this.initialized = true;
    });
    this.dispose = autorun(() => {
      const loaders = this.activeLoaders();
      if (!this.exception && loaders.some(loader => pending(loader) && !loader.isError() && loader.isLoadable?.() !== false)) {
        this.schedule();
      }
    });
    return () => {
      this.generation++;
      this.dispose?.();
      this.dispose = undefined;
    };
  }

  private activeLoaders(): ILoadableState[] {
    return this.activeRequests().map(request => request.loader);
  }

  private isContentLoaded(loadLazy: boolean): boolean {
    return (
      this.prepared &&
      (this.handler?.isHidden?.(this.context) === true || this.loaders.filter(loader => !loader.lazy || loadLazy).every(loader => !pending(loader)))
    );
  }

  private activeRequests(): IMenuLoadRequest[] {
    const requests = this.preparationLoaders.map(loader => ({ loader, context: this.context, revision: this.context.revision }));
    if (!this.prepared || this.handler?.isHidden?.(this.context)) {
      return requests;
    }
    requests.push(
      ...this.loaders
        .filter(loader => !loader.lazy || this.loadLazy)
        .map(loader => ({ loader, context: this.context, revision: this.context.revision })),
    );
    if (this.open) {
      for (const item of this.items) {
        if (!item.hidden && item instanceof MenuSubMenuItem) {
          requests.push(...(this.getSubMenu(item)?.activeRequests() ?? []));
        }
      }
    }
    return requests;
  }

  private schedule(): void {
    if (this.task) {
      this.rerun = true;
      return;
    }
    if (this.scheduled) {
      return;
    }
    this.scheduled = true;
    queueMicrotask(() => {
      this.scheduled = false;
      if (this.dispose && !this.retrying) {
        void this.loadPending();
      }
    });
  }

  private loadPending(): Promise<void> {
    if (this.task) {
      return this.task;
    }
    const generation = this.generation;
    this.task = (async () => {
      for (const { loader, context, revision } of this.activeRequests()) {
        if (generation !== this.generation || !this.dispose) {
          return;
        }
        if (context.revision !== revision) {
          continue;
        }
        if (!this.activeLoaders().includes(loader)) {
          continue;
        }
        if (!pending(loader) || loader.isError() || loader.isLoadable?.() === false) {
          continue;
        }
        try {
          await loader.load();
        } catch (error) {
          if (generation === this.generation && context.revision === revision) {
            runInAction(() => {
              this.failure = { error: error instanceof Error ? error : new Error(String(error)), loader, context, revision };
            });
          }
          return;
        }
      }
    })().finally(() => {
      this.task = undefined;
      if (this.rerun) {
        this.rerun = false;
        this.schedule();
      }
    });
    return this.task;
  }
}
