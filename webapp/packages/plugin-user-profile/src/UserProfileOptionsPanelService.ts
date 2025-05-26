/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutionContext, Executor, type IExecutor, type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import { userProfileContext } from './userProfileContext.js';
import { UserProfileTabsService } from './UserProfileTabsService.js';

const UserProfileOptionsPanel = importLazyComponent(() => import('./UserProfileOptionsPanel.js').then(m => m.UserProfileOptionsPanel));
const panelGetter = () => UserProfileOptionsPanel;

@injectable()
export class UserProfileOptionsPanelService {
  readonly onOpen: ISyncExecutor;
  readonly onClose: IExecutor;

  constructor(
    private readonly optionsPanelService: OptionsPanelService,
    private readonly userInfoResource: UserInfoResource,
    private readonly userProfileTabsService: UserProfileTabsService,
  ) {
    this.onOpen = new SyncExecutor();
    this.onClose = new Executor();

    this.optionsPanelService.closeTask.next(this.onClose, undefined, data => data === 'before' && this.optionsPanelService.isOpen(panelGetter));
    this.userInfoResource.onDataUpdate.addHandler(this.userUpdateHandler.bind(this));

    makeObservable(this, {
      open: action,
      close: action,
    });
  }

  async open(tabId?: string): Promise<boolean> {
    if (isNotNullDefined(tabId)) {
      this.userProfileTabsService.tabContainer.select(tabId);
    } else {
      this.userProfileTabsService.tabContainer.select(null);
    }

    if (this.optionsPanelService.isOpen(panelGetter)) {
      return true;
    }

    const state = await this.optionsPanelService.open(panelGetter);

    if (state) {
      this.onOpen.execute();
    }

    return state;
  }

  async close(force?: boolean): Promise<void> {
    if (!this.optionsPanelService.isOpen(panelGetter)) {
      return;
    }

    const context = new ExecutionContext<void>(undefined);

    if (force) {
      const userProfile = context.getContext(userProfileContext);
      userProfile.setForce(force);
    }

    await this.optionsPanelService.close(context);
  }

  private userUpdateHandler() {
    if (!this.optionsPanelService.isOpen(panelGetter)) {
      return;
    }

    if (!this.userInfoResource.hasAccess()) {
      this.close(true);
    }
  }
}
