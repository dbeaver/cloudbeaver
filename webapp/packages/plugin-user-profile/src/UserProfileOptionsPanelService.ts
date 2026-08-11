/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutionContext, Executor, ExecutorInterrupter, type IExecutor, type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { BaseOptionsPanelService, OptionsPanelService } from '@cloudbeaver/core-ui';

import { userProfileContext } from './userProfileContext.js';
import { UserProfileTabsService } from './UserProfileTabsService.js';

const UserProfileOptionsPanel = importLazyComponent(() => import('./UserProfileOptionsPanel.js').then(m => m.UserProfileOptionsPanel));
const panelGetter = () => UserProfileOptionsPanel;

@injectable(() => [OptionsPanelService, UserInfoResource, UserProfileTabsService])
export class UserProfileOptionsPanelService extends BaseOptionsPanelService<string | undefined> {
  readonly onOpen: ISyncExecutor;
  readonly onBeforeTabChange: IExecutor<string>;

  constructor(
    optionsPanelService: OptionsPanelService,
    private readonly userInfoResource: UserInfoResource,
    private readonly userProfileTabsService: UserProfileTabsService,
  ) {
    super(optionsPanelService, panelGetter);

    this.onOpen = new SyncExecutor();
    this.onBeforeTabChange = new Executor();
    this.userInfoResource.onDataUpdate.addHandler(this.userUpdateHandler.bind(this));
  }

  override async open(tabId?: string): Promise<boolean> {
    if (this.isOpen()) {
      if (tabId !== undefined) {
        await this.selectTab(tabId);
      }

      return true;
    }

    const state = await super.open(tabId ?? this.userProfileTabsService.tabContainer.getIdList()[0]);

    if (state) {
      this.onOpen.execute();
    }

    return state;
  }

  override async close(force?: boolean): Promise<void> {
    if (!this.isOpen()) {
      return;
    }

    const context = new ExecutionContext<void>(undefined);

    if (force) {
      const userProfile = context.getContext(userProfileContext);
      userProfile.setForce(force);
    }

    await this.optionsPanelService.close(context);
  }

  private async selectTab(tabId: string): Promise<void> {
    if (this.itemId === tabId) {
      return;
    }

    const contexts = await this.onBeforeTabChange.execute(tabId);

    if (ExecutorInterrupter.isInterrupted(contexts)) {
      return;
    }

    this.itemId = tabId;
  }

  private userUpdateHandler() {
    if (!this.isOpen()) {
      return;
    }

    if (!this.userInfoResource.hasAccess()) {
      this.close(true);
    }
  }
}
