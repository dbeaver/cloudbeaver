/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { ConnectionsManagerService, type IConnectionExecutorData } from '@cloudbeaver/core-connections';
import { Dependency, injectable } from '@cloudbeaver/core-di';
import type { IExecutorHandler } from '@cloudbeaver/core-executor';
import { DBObjectParentKey, DBObjectResource, NavTreeResource, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import {
  CACHED_RESOURCE_DEFAULT_PAGE_LIMIT,
  CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
  createResourceOffsetPageKey,
  getNextPageOffset,
  type ResourceKey,
} from '@cloudbeaver/core-resource';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import type { IObjectViewerTabState } from '../IObjectViewerTabState';
import { ObjectPage, ObjectPageCallback, ObjectPageOptions } from './ObjectPage';

interface IOptions<TKey extends ResourceKey<any>> {
  key: TKey;
  pageSize?: number;
}

@injectable()
export class DBObjectPageService extends Dependency {
  pages = new Map<string, ObjectPage<any>>();

  constructor(
    private readonly navNodeViewService: NavNodeViewService,
    private readonly navTreeResource: NavTreeResource,
    private readonly dbObjectResource: DBObjectResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
  ) {
    super();

    this.connectionsManagerService.onDisconnect.addHandler(this.onDisconnectHandle.bind(this));

    makeObservable(this, {
      pages: observable,
      orderedPages: computed,
      register: action,
      selectPage: action.bound,
    });
  }

  get orderedPages(): Array<ObjectPage<any>> {
    return Array.from(this.pages.values()).sort(this.comparePages.bind(this));
  }

  onDisconnectHandle: IExecutorHandler<IConnectionExecutorData, any> = (data, contexts) => {
    if (data.state === 'before') {
      data.connections.forEach(connection => {
        const id = NodeManagerUtils.connectionIdToConnectionNodeId(connection.connectionId);
        const children = this.navTreeResource.get(id);
        const folders = this.navNodeViewService.getFolders(id, children) || [];
        const properties = folders.map(DBObjectParentKey);

        properties.forEach(key => {
          const dbObjectKey = this.getDBObjectKey({ key, pageSize: this.navTreeResource.childrenLimit });
          this.dbObjectResource.markOutdated(dbObjectKey);
        });
      });
    }
  };

  // TODO isolate this logic somewhere (repeats useOffsetPagination logic)
  private getDBObjectKey(options: IOptions<ResourceKey<any>>) {
    const targetKey = options?.key;
    const pageSize = options?.pageSize || CACHED_RESOURCE_DEFAULT_PAGE_LIMIT;
    const pageInfo = this.dbObjectResource.offsetPagination.getPageInfo(createResourceOffsetPageKey(0, 0, targetKey));
    const offset = Math.max(
      (pageInfo ? getNextPageOffset(pageInfo) : CACHED_RESOURCE_DEFAULT_PAGE_OFFSET) - pageSize,
      CACHED_RESOURCE_DEFAULT_PAGE_OFFSET,
    );
    const _key = createResourceOffsetPageKey(offset, pageSize, targetKey);

    const pageInfoTarget = this.dbObjectResource.offsetPagination.getPageInfo(createResourceOffsetPageKey(0, 0, _key.target));

    for (const page of pageInfoTarget?.pages || []) {
      if (page.outdated && page.from < _key.options.offset) {
        return createResourceOffsetPageKey(page.from, _key.options.limit, _key.target);
      }
    }

    return _key;
  }

  register<T>(options: ObjectPageOptions<T>): ObjectPage<T> {
    const objectPage = new ObjectPage(options);
    this.pages.set(options.key, objectPage);
    return objectPage;
  }

  getPage<T>(pageId: string): ObjectPage<T> | undefined {
    return this.pages.get(pageId);
  }

  getPageState<T>(tab: ITab<IObjectViewerTabState>, page: ObjectPage<T> | string): T | undefined {
    const pageKey = typeof page === 'string' ? page : page.key;

    return tab.handlerState.pagesState[pageKey];
  }

  canSwitchPage(currentPage: ObjectPage<any>, page: ObjectPage<any>): boolean {
    if ((currentPage.priority || 0) < page.priority) {
      return true;
    }
    return false;
  }

  trySwitchPage<T>(tab: ITab<IObjectViewerTabState>, page: ObjectPage<T>, state?: T): boolean {
    const currentPage = this.getPage(tab.handlerState.pageId);

    const canSwitch = !currentPage || this.canSwitchPage(currentPage, page);

    if (canSwitch) {
      this.selectPage(tab, page, state);
      return true;
    }
    return false;
  }

  selectPage<T>(tab: ITab<IObjectViewerTabState>, page: ObjectPage<T>, state?: T): void {
    tab.handlerState.pageId = page.key;

    if (state !== undefined) {
      tab.handlerState.pagesState[page.key] = state;
    }

    this.callHandlerCallback(tab, page => page.onSelect);
  }

  async restorePages(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    for (const page of this.pages.values()) {
      if (page.onRestore && !(await page.onRestore(tab, this.getPageState(tab, page)))) {
        return false;
      }
    }
    return true;
  }

  async canClosePages(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    for (const page of this.pages.values()) {
      const state = await page.canClose?.(tab, this.getPageState(tab, page));

      if (state === false) {
        return false;
      }
    }

    return true;
  }

  async closePages(tab: ITab<IObjectViewerTabState>) {
    await this.callHandlerCallback(tab, page => page.onClose);
  }

  private async callHandlerCallback<T>(tab: ITab<IObjectViewerTabState>, selector: (page: ObjectPage<T>) => ObjectPageCallback<T> | undefined) {
    for (const page of this.pages.values()) {
      const callback = selector(page);
      if (callback) {
        callback.call(page, tab, this.getPageState(tab, page));
      }
    }
  }

  private comparePages(pageA: ObjectPage, pageB: ObjectPage) {
    return this.getPageOrder(pageA) - this.getPageOrder(pageB);
  }

  private getPageOrder(page: ObjectPage) {
    // TODO: can be configurable later
    return page.order || Number.MAX_SAFE_INTEGER;
  }
}
