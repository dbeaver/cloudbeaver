/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action, computed } from 'mobx';

import { ITab } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';

import { IObjectViewerTabState } from '../IObjectViewerTabState';
import { ObjectPage, ObjectPageOptions, ObjectPageCallback } from './ObjectPage';

@injectable()
export class DBObjectPageService {
  @observable pages = new Map<string, ObjectPage<any>>();

  @computed get orderedPages(): ObjectPage<any>[] {
    return Array.from(this.pages.values())
      .sort(this.comparePages.bind(this));
  }

  @action register<T>(options: ObjectPageOptions<T>): ObjectPage<T> {
    const objectPage = new ObjectPage(options);
    this.pages.set(options.key, objectPage);
    return objectPage;
  }

  getPage<T>(pageId: string): ObjectPage<T> | undefined {
    return this.pages.get(pageId);
  }

  getPageState<T>(tab: ITab<IObjectViewerTabState>, page: ObjectPage<T>| string): T | undefined {
    const pageKey = typeof page === 'string' ? page : page.key;

    return tab.handlerState.pagesState.get(pageKey);
  }

  trySwitchPage<T>(tab: ITab<IObjectViewerTabState>, page: ObjectPage<T>, state?: T): boolean {
    const currentPage = this.getPage(tab.handlerState.pageId);

    if ((currentPage?.priority || 0) < page.priority) {
      this.selectPage(tab, page, state);
      return true;
    }
    return false;
  }

  selectPage = async <T>(tab: ITab<IObjectViewerTabState>, page: ObjectPage<T>, state?: T) => {
    tab.handlerState.pageId = page.key;
    if (state !== undefined) {
      tab.handlerState.pagesState.set(page.key, state);
    }
    await this.callHandlerCallback(tab, page => page.onSelect);
  }

  async restorePages(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    for (const page of this.pages.values()) {
      if (page.onRestore && !page.onRestore(tab, this.getPageState(tab, page))) {
        return false;
      }
    }
    return true;
  }

  async closePages(tab: ITab<IObjectViewerTabState>) {
    await this.callHandlerCallback(tab, page => page.onClose);
  }

  private async callHandlerCallback<T>(
    tab: ITab<IObjectViewerTabState>,
    selector: (page: ObjectPage<T>) => ObjectPageCallback<T> | undefined
  ) {
    for (const page of this.pages.values()) {
      const callback = selector(page);
      if (callback) {
        await callback.call(page, tab, this.getPageState(tab, page));
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
