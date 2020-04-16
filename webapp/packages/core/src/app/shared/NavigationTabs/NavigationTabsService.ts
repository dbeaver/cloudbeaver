/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  observable, action,
  computed, IKeyValueMap,
} from 'mobx';
import { Subject } from 'rxjs';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { LocalStorageSaveService } from '@dbeaver/core/settings';

import { Tab, TabHandlerState } from './Tab';
import { TabHandler, TabHandlerOptions, TabHandlerEvent } from './TabHandler';
import { TabNavigationContext, ITabNavigationContext } from './TabNavigationContext';

type TabsState = {
  tabs: string[];
  history: string[];
  currentId: string;
}

const NAVIGATION_TABS_BASE_KEY = 'navigation_tabs';

@injectable()
export class NavigationTabsService {
  @observable handlers = new Map<string, TabHandler>();
  @observable tabsMap = new Map<string, Tab>();
  @observable state: TabsState = {
    tabs: [],
    history: [],
    currentId: '',
  };

  @computed get sortedHandlerList(): string[] {
    return Array.from(this.handlers.keys()).sort((a, b) => this.compareHandlers(a, b));
  }

  @computed get currentTabId(): string {
    return this.state.currentId;
  }

  @computed get tabIdList(): string[] {
    return this.state.tabs;
  }

  onTabActivate = new Subject<Tab>();

  constructor(private notificationService: NotificationService,
              private autoSaveService: LocalStorageSaveService) {
    this.autoSaveService.withAutoSave(
      this.tabsMap,
      `${NAVIGATION_TABS_BASE_KEY}_tab_map`,
      (json): IKeyValueMap<Tab> => {
        const map: IKeyValueMap<Tab> = {};
        for (const [key, value] of Object.entries(json as IKeyValueMap<Tab>)) {
          if (
            typeof value.nodeId === 'string'
            && typeof value.handlerId === 'string'
            && typeof value.handlerState === 'object'
            && !Array.isArray(value.handlerState) // temporary for old sessions, can be removed later
            && (!value.name || typeof value.name === 'string')
            && (!value.icon || typeof value.icon === 'string')
          ) {
            const handlerStateMap = observable.map(value.handlerState);
            if (Array.from(handlerStateMap.values()).every(v => typeof v.handlerId === 'string')) {
              value.handlerState = handlerStateMap;
              map[key] = new Tab(value);
            }
          }
        }
        return map;
      }
    );

    this.autoSaveService.withAutoSave(this.state, NAVIGATION_TABS_BASE_KEY);
  }

  @action openTab(tab: Tab, isSelected?: boolean) {
    this.tabsMap.set(tab.nodeId, tab);
    this.state.tabs.push(tab.nodeId);

    if (isSelected) {
      this.selectTab(tab.nodeId);
    }
  }

  @action selectTab(tabId: string, skipHandlers?: boolean) {
    const tab = this.tabsMap.get(tabId);
    if (!tab) {
      return;
    }

    if (this.state.currentId !== tabId) {
      this.state.history.unshift(tabId);
      this.state.currentId = tabId;
    }

    if (!skipHandlers) {
      this.callHandlerCallback(tab, handler => handler.onSelect);
    }

    this.onTabActivate.next(this.getTab(tabId));
  }

  @action closeTab(tabId: string, skipHandlers?: boolean) {
    const tab = this.tabsMap.get(tabId);
    if (tab && !skipHandlers) {
      this.callHandlerCallback(tab, handler => handler.onClose);
    }

    this.state.history = this.state.history.filter(id => id !== tabId);
    if (this.state.currentId === tabId) {
      this.selectTab(this.state.history[0] || '', skipHandlers);
    }
    this.tabsMap.delete(tabId);
    this.state.tabs = this.state.tabs.filter(id => id !== tabId);
  }

  @action registerTabHandler(options: TabHandlerOptions) {
    this.handlers.set(options.key, new TabHandler(options));
  }

  @action selectHandler(handlerId: string) {
    const tab = this.tabsMap.get(this.state.currentId);
    if (!tab || tab.handlerId === handlerId) {
      return;
    }

    tab.selectHandler(handlerId);
    this.callHandlerCallback(tab, handler => handler.onSelect);
  }

  @action updateHandlerState<T>(tabId: string, state: TabHandlerState<T>) {
    const tab = this.tabsMap.get(tabId);
    if (tab) {
      tab.updateHandlerState(state);
    }
  }

  getTabHandler(handlerId: string): TabHandler | undefined {
    return this.handlers.get(handlerId);
  }

  getHandlerState<T>(tabId: string, handlerId: string): T | undefined {
    const tab = this.tabsMap.get(tabId);

    if (!tab) {
      return;
    }

    return tab.getHandlerState<T>(handlerId);
  }

  getTab(tabId: string): Tab | undefined {
    return this.tabsMap.get(tabId);
  }

  // must be executed with low priority, because this call runs many requests to backend and blocks others
  async restoreTabs() {
    const removedTabs: string[] = [];
    const restoreTasks: Promise<void>[] = [];

    for (const tabId of this.state.tabs) {
      const tab = this.tabsMap.get(tabId);
      if (!tab) {
        removedTabs.push(tabId);
        continue;
      }

      restoreTasks.push(this.restoreTab(tab, removedTabs));
    }

    await Promise.all(restoreTasks);

    if (removedTabs.length > 0) {
      this.notificationService.logError({ title: 'Some tabs cannot be load properly' });
    }

    for (const tabId of removedTabs) {
      this.closeTab(tabId, true);
    }

    if (this.tabsMap.has(this.state.currentId)) {
      this.selectTab(this.state.currentId);
    }
  }

  navigationTabContext = (): ITabNavigationContext => new TabNavigationContext(this)

  private async callHandlerCallback(tab: Tab, selector: (handler: TabHandler) => TabHandlerEvent | undefined) {
    for (const handlerState of tab.handlerState.values()) {
      const handler = this.handlers.get(handlerState.handlerId);
      if (handler) {
        const callback = selector(handler);
        if (callback) {
          callback.call(handler, tab.nodeId, tab.handlerId);
        }
      }
    }
  }

  private async restoreTab(tab: Tab, removedTabs: string[]): Promise<void> {
    let restoreFail = false;
    try {
      for (const handlerState of tab.handlerState.values()) {
        const handler = this.handlers.get(handlerState.handlerId);

        if (!handler) {
          restoreFail = true;
          break;
        }

        if (handler.onRestore && !await handler.onRestore(tab.nodeId, tab.handlerId)) {
          restoreFail = true;
          break;
        }
      }
    } catch {
      restoreFail = true;
    }

    if (restoreFail) {
      removedTabs.push(tab.nodeId);
    }
  }

  private compareHandlers(a: string, b: string) {
    return this.getHandlerOrder(a) - this.getHandlerOrder(b);
  }

  private getHandlerOrder(handlerId: string) {
    return this.handlers.get(handlerId)?.order || Number.MAX_SAFE_INTEGER;
  }
}
