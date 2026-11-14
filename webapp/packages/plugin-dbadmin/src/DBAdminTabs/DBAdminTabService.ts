/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { uuid } from '@cloudbeaver/core-utils';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

import { type DBAdminManager, isDBAdminManager } from '../DBAdminManager.js';
import type { IDBAdminTabState } from './IDBAdminTabState.js';

const DBAdminNavigationTab = importLazyComponent(() => import('./DBAdminNavigationTab.js').then(m => m.DBAdminNavigationTab));
const DBAdminNavigationPanel = importLazyComponent(() => import('./DBAdminNavigationPanel.js').then(m => m.DBAdminNavigationPanel));

const DBADMIN_TAB_HANDLER_KEY = 'dbadmin';

/** Opens session and lock managers in their own main area tabs */
@injectable(() => [NavigationTabsService, UserInfoResource])
export class DBAdminTabService {
  constructor(
    private readonly navigationTabsService: NavigationTabsService,
    private readonly userInfoResource: UserInfoResource,
  ) {}

  /** Registers the tab handler. Call it during bootstrap so that tabs saved in the previous session are restored. */
  register(): void {
    this.navigationTabsService.registerTabHandler<IDBAdminTabState>({
      key: DBADMIN_TAB_HANDLER_KEY,
      getTabComponent: () => DBAdminNavigationTab,
      getPanelComponent: () => DBAdminNavigationPanel,
      onRestore: tab => isTabState(tab.handlerState),
    });
  }

  /** Selects the manager tab of the connection, or opens a new one */
  open(connection: IConnectionInfoParams, manager: DBAdminManager): void {
    const existing = this.navigationTabsService.findTab(
      (tab: ITab) =>
        tab.handlerId === DBADMIN_TAB_HANDLER_KEY &&
        tab.handlerState.projectId === connection.projectId &&
        tab.handlerState.connectionId === connection.connectionId &&
        tab.handlerState.manager === manager,
    );

    if (existing) {
      this.navigationTabsService.selectTab(existing.id);
      return;
    }

    this.navigationTabsService.openTab(
      {
        id: uuid(),
        userId: this.userInfoResource.getId(),
        projectId: connection.projectId,
        handlerId: DBADMIN_TAB_HANDLER_KEY,
        handlerState: { projectId: connection.projectId, connectionId: connection.connectionId, manager },
      },
      true,
    );
  }
}

function isTabState(state: unknown): state is IDBAdminTabState {
  const value = state as Partial<IDBAdminTabState> | undefined;

  return typeof value?.projectId === 'string' && typeof value.connectionId === 'string' && isDBAdminManager(value.manager);
}
