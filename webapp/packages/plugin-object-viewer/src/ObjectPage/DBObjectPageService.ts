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
  @observable pages = new Map<string, ObjectPage>();

  @computed get orderedPages(): ObjectPage[] {
    return Array.from(this.pages.values())
      .sort(this.comparePages.bind(this));
  }

  @action register(options: ObjectPageOptions): ObjectPage {
    const objectPage = new ObjectPage(options);
    this.pages.set(options.key, objectPage);
    return objectPage;
  }

  getPage(pageId: string) {
    return this.pages.get(pageId);
  }

  trySwitchPage(tab: ITab<IObjectViewerTabState>, page: ObjectPage): boolean {
    const currentPage = this.getPage(tab.handlerState.pageId);

    if ((currentPage?.priority || 0) < page.priority) {
      this.selectPage(tab, page);
      return true;
    }
    return false;
  }

  selectPage = async (tab: ITab<IObjectViewerTabState>, page: ObjectPage) => {
    tab.handlerState.pageId = page.key;
    await this.callHandlerCallback(tab, page => page.onSelect);
  }

  async restorePages(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    for (const page of this.pages.values()) {
      if (page.onRestore && !page.onRestore(tab)) {
        return false;
      }
    }
    return true;
  }

  async closePages(tab: ITab<IObjectViewerTabState>) {
    await this.callHandlerCallback(tab, page => page.onClose);
  }

  private async callHandlerCallback(
    tab: ITab<IObjectViewerTabState>,
    selector: (page: ObjectPage) => ObjectPageCallback | undefined
  ) {
    for (const page of this.pages.values()) {
      const callback = selector(page);
      if (callback) {
        await callback.call(page, tab);
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
