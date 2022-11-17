/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, action, computed, makeObservable, runInAction } from 'mobx';

import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AppAuthService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { LocalStorageSaveService } from '@cloudbeaver/core-settings';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { ACTION_OPEN_IN_TAB, IActiveView, View } from '@cloudbeaver/core-view';

import type { ITab } from './ITab';
import { TabHandler, TabHandlerOptions, TabHandlerEvent, TabSyncHandlerEvent } from './TabHandler';
import { TabNavigationContext, ITabNavigationContext } from './TabNavigationContext';

interface INavigatorHistory {
  history: string[];
  currentId: string | null;
}

interface TabsState {
  tabs: string[];
}

const MULTI_PROJECTS = '@://multi_projects//';

const NAVIGATION_TABS_BASE_KEY = 'navigation_tabs';

@injectable()
export class NavigationTabsService extends View<ITab> {
  handlers = new Map<string, TabHandler>();
  tabsMap = new Map<string, ITab>();
  state = new Map<string, TabsState>();
  historyState = new Map<string, INavigatorHistory>();

  get currentTab(): ITab | undefined {
    if (this.currentTabId) {
      return this.getTab(this.currentTabId);
    }
    return undefined;
  }

  get currentTabId(): string | null {
    if (
      this.history.currentId !== null
      && this.tabIdList.includes(this.history.currentId)
    ) {
      return this.history.currentId;
    }

    return null;
  }

  get tabIdList(): string[] {
    return Array.from(this.tabsMap.values())
      .filter(tab => (
        tab.restored
        && tab.userId === this.userInfoResource.getId()
        && (
          tab.projectId === null
          || this.projectsService.activeProjects.some(project => project.id === tab.projectId)
        )
      ))
      .map(tab => tab.id);
  }

  get history(): INavigatorHistory {
    let projectId = MULTI_PROJECTS;

    if (this.projectsService.activeProjects.length === 1) {
      projectId = this.projectsService.activeProjects[0].id;
    }

    if (!this.historyState.has(projectId)) {
      this.historyState.set(projectId, {
        history: [],
        currentId: null,
      });
    }

    return this.historyState.get(projectId)!;
  }

  get userTabsState(): TabsState {
    const userId = this.userInfoResource.getId();

    if (!this.state.has(userId)) {
      this.state.set(userId, {
        tabs: [],
      });
    }

    return this.state.get(userId)!;
  }

  readonly navigationTabContext: () => ITabNavigationContext;
  readonly onTabSelect: ISyncExecutor<ITab>;
  readonly onTabClose: ISyncExecutor<ITab | undefined>;
  readonly onInit: ISyncExecutor<boolean>;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly autoSaveService: LocalStorageSaveService,
    private readonly userInfoResource: UserInfoResource,
    private readonly projectsService: ProjectsService,
    private readonly administrationScreenService: AdministrationScreenService,
    private readonly appAuthService: AppAuthService
  ) {
    super();

    this.onTabSelect = new SyncExecutor();
    this.onTabClose = new SyncExecutor();
    this.onInit = new SyncExecutor();

    this.navigationTabContext = (): ITabNavigationContext => new TabNavigationContext(this, this.userInfoResource);
    this.registerAction(ACTION_OPEN_IN_TAB);

    makeObservable<NavigationTabsService, 'unloadTabs'>(this, {
      handlers: observable,
      tabsMap: observable,
      state: observable,
      historyState: observable,
      currentTab: computed,
      currentTabId: computed,
      tabIdList: computed<string[]>({
        equals: isArraysEqual,
      }),
      openTab: action,
      selectTab: action,
      closeTab: action,
      registerTabHandler: action,
      updateHandlerState: action,
      unloadTabs: action,
      closeTabSilent: action,
    });

    this.autoSaveService.withAutoSave(
      this.tabsMap,
      `${NAVIGATION_TABS_BASE_KEY}_tab_map`,
      map => {
        for (const [key, value] of Array.from(map.entries())) {
          if (
            typeof value.id === 'string'
            && typeof value.handlerId === 'string'
            && typeof value.userId === 'string'
            && ['object', 'string'].includes(typeof value.projectId)
          ) {
            value.restored = false;
          } else {
            map.delete(key);
          }
        }
        return map;
      }
    );

    this.autoSaveService.withAutoSave(
      this.historyState,
      `${NAVIGATION_TABS_BASE_KEY}_history`,
      map => {
        for (const [key, value] of Array.from(map.entries())) {
          if (
            !['object', 'string'].includes(typeof value.currentId)
            || !Array.isArray(value.history)
          ) {
            map.delete(key);
          }
        }
        return map;
      }
    );

    this.autoSaveService.withAutoSave(
      this.state,
      NAVIGATION_TABS_BASE_KEY,
      map => {
        for (const [key, value] of Array.from(map.entries())) {
          if (
            !Array.isArray(value.tabs)
          ) {
            map.delete(key);
          }
        }
        return map;
      }
    );

    this.userInfoResource.onDataUpdate.addHandler(this.unloadTabs.bind(this));
  }

  openTab(tab: ITab, isSelected?: boolean): void {
    this.tabsMap.set(tab.id, tab);
    this.userTabsState.tabs.push(tab.id);

    if (isSelected) {
      this.selectTab(tab.id);
    }
  }

  selectTab(tabId: string | null, skipHandlers?: boolean): void {
    if (tabId === null) {
      this.history.currentId = null;
      return;
    }

    if (
      !this.userTabsState.tabs.includes(tabId)
      || !this.tabIdList.includes(tabId)
    ) {
      return;
    }

    const tab = this.tabsMap.get(tabId);

    if (!tab) {
      return;
    }

    if (this.history.currentId !== tabId) {
      this.history.history = this.history.history.filter(id => id !== tabId);
      this.history.history.unshift(tabId);
      this.history.currentId = tabId;
      this.onTabSelect.execute(tab);
    }

    if (!skipHandlers) {
      this.callHandlerCallback(tab, handler => handler.onSelect);
    }
  }

  async closeTab(tabId: string, skipHandlers?: boolean): Promise<void> {
    if (!this.userTabsState.tabs.includes(tabId)) {
      return;
    }

    const tab = this.tabsMap.get(tabId);
    if (tab && !skipHandlers) {
      const handler = this.handlers.get(tab.handlerId);

      if (handler) {
        const state = await handler.canClose?.(tab);

        if (state === false) {
          return;
        }
      }

      await this.callHandlerCallback(tab, handler => handler.onClose);
      await this.callHandlerCallback(tab, handler => handler.onUnload);
    }

    this.closeTabSilent(tabId, skipHandlers);
  }

  closeTabSilent(key: ResourceKey<string>, skipHandlers?: boolean): void {
    ResourceKeyUtils.forEach(key, tabId => {
      if (!this.userTabsState.tabs.includes(tabId)) {
        return;
      }

      const tab = this.tabsMap.get(tabId);

      if (tab) {
        this.onTabClose.execute(tab);

        this.history.history = this.history.history.filter(id => id !== tabId);
        this.tabsMap.delete(tabId);
        this.userTabsState.tabs = this.userTabsState.tabs.filter(id => id !== tabId);
        this.callHandlerSyncCallback(tab, handler => handler.onCloseSilent);
      }
    });

    if (ResourceKeyUtils.includes(key, this.history.currentId)) {
      this.selectTab(this.history.history.shift() ?? '', skipHandlers);
    }
  }

  registerTabHandler<TState>(options: TabHandlerOptions<TState>): TabHandler<TState> {
    const tabHandler = new TabHandler(options);
    this.handlers.set(options.key, tabHandler);
    return tabHandler;
  }

  updateHandlerState<T>(tabId: string, state: T): void {
    const tab = this.tabsMap.get(tabId);
    if (tab) {
      tab.handlerState = state;
    }
  }

  getView = (): IActiveView<ITab> | null => {
    if (!this.currentTabId) {
      return null;
    }

    const tab = this.getTab(this.currentTabId);

    if (!tab) {
      return null;
    }

    const handler = this.getTabHandler(tab.handlerId);

    if (!handler) {
      return null;
    }

    return {
      context: tab,
      extensions: handler.extensions || [],
    };
  };

  getTabHandler(handlerId: string): TabHandler | undefined {
    return this.handlers.get(handlerId);
  }

  getHandlerState<T>(tabId: string): T | undefined {
    const tab = this.tabsMap.get(tabId);

    if (!tab) {
      return;
    }

    return tab.handlerState;
  }

  getTab(tabId: string): ITab | undefined {
    return this.tabsMap.get(tabId);
  }

  findTab<S extends ITab>(predicate: (tab: ITab) => tab is S): S | null;
  findTab(predicate: (tab: ITab) => boolean): ITab | null;
  findTab(predicate: (tab: ITab) => boolean): ITab | null {
    for (const tab of this.tabsMap.values()) {
      if (tab.restored && tab.userId === this.userInfoResource.getId() && predicate(tab)) {
        return tab;
      }
    }
    return null;
  }

  findTabs(predicate: (tab: ITab) => boolean): Generator<ITab>;
  findTabs<S>(predicate: (tab: ITab) => tab is ITab<S>): Generator<ITab<S>>;
  * findTabs(predicate: (tab: ITab) => boolean): Generator<ITab> {
    for (const tab of this.tabsMap.values()) {
      if (tab.restored && tab.userId === this.userInfoResource.getId() && predicate(tab)) {
        yield tab;
      }
    }
  }

  async unloadTabs(): Promise<void> {
    // if (this.administrationScreenService.publicDisabled) {
    //   return;
    // }
    this.onInit.execute(false);
    for (const tab of this.tabsMap.values()) {
      if (tab.userId !== this.userInfoResource.getId()) {
        if (tab.restored) {
          await this.callHandlerCallback(tab, handler => handler.onUnload);
          tab.restored = false;
        }
      }
    }
  }

  // must be executed with low priority, because this call runs many requests to backend and blocks others
  async restoreTabs(): Promise<void> {
    if (this.administrationScreenService.publicDisabled) {
      return;
    }

    if (!this.appAuthService.authenticated) {
      return;
    }

    const removedTabs: string[] = [];

    for (const tabId of this.userTabsState.tabs) {
      const tab = this.tabsMap.get(tabId);
      if (!tab) {
        removedTabs.push(tabId);
        continue;
      }

      await this.restoreTab(tab, removedTabs);
    }

    if (removedTabs.length > 0) {
      this.notificationService.logError({ title: 'Some tabs cannot be restored properly', isSilent: true });
    }

    runInAction(() => {
      this.closeTabSilent(resourceKeyList(removedTabs), true);

      if (this.history.currentId) {
        const tab = this.tabsMap.get(this.history.currentId);

        if (tab) {
          this.selectTab(this.history.currentId);
          this.onTabSelect.execute(tab);
        }
      }

      this.onInit.execute(true);
    });
  }

  private callHandlerSyncCallback(tab: ITab, selector: (handler: TabHandler) => TabSyncHandlerEvent | undefined) {
    const handler = this.handlers.get(tab.handlerId);

    if (!handler) {
      return;
    }

    const callback = selector(handler);

    if (callback) {
      callback.call(handler, tab);
    }
  }

  private async callHandlerCallback(tab: ITab, selector: (handler: TabHandler) => TabHandlerEvent | undefined) {
    const handler = this.handlers.get(tab.handlerId);

    if (!handler) {
      return;
    }

    const callback = selector(handler);

    if (callback) {
      await callback.call(handler, tab);
    }
  }

  private async restoreTab(tab: ITab, removedTabs: string[]): Promise<void> {
    if (tab.restored) {
      return;
    }

    let restoreFail = false;
    try {
      const handler = this.handlers.get(tab.handlerId);

      if (!handler || (handler.onRestore && !(await handler.onRestore(tab)))) {
        restoreFail = true;
      }
    } catch (exception: any) {
      restoreFail = true;
    }

    if (restoreFail) {
      removedTabs.push(tab.id);
    } else {
      tab.restored = true;
    }
  }
}
