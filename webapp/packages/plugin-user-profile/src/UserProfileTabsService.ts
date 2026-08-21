/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter, type IExecutor } from '@cloudbeaver/core-executor';
import { TabsContainer } from '@cloudbeaver/core-ui';

import { UserProfileOptionsPanelService } from './UserProfileOptionsPanelService.js';

@injectable(() => [UserProfileOptionsPanelService])
export class UserProfileTabsService {
  selectedTabId: string | null;
  readonly tabContainer: TabsContainer;
  readonly onBeforeTabChange: IExecutor<string>;

  constructor(private readonly userProfileOptionsPanelService: UserProfileOptionsPanelService) {
    this.selectedTabId = null;
    this.tabContainer = new TabsContainer('User Profile');
    this.onBeforeTabChange = new Executor();

    this.userProfileOptionsPanelService.onClose.addHandler(data => {
      if (data === 'after') {
        this.selectedTabId = null;
      }
    });

    makeObservable(this, {
      selectedTabId: observable.ref,
      open: action,
    });
  }

  async open(tabId?: string): Promise<boolean> {
    if (!this.userProfileOptionsPanelService.isOpen()) {
      this.selectedTabId = tabId ?? this.tabContainer.getIdList()[0] ?? null;

      const state = await this.userProfileOptionsPanelService.open();

      if (!state) {
        this.selectedTabId = null;
      }

      return state;
    }

    if (tabId !== undefined && tabId !== this.selectedTabId) {
      const contexts = await this.onBeforeTabChange.execute(tabId);

      if (!ExecutorInterrupter.isInterrupted(contexts)) {
        this.selectedTabId = tabId;
      }
    }

    return true;
  }
}
