/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { userProfileContext } from '../../userProfileContext.js';
import { UserProfileTabsService } from '../../UserProfileTabsService.js';
import { UserProfileOptionsPanelService } from '../../UserProfileOptionsPanelService.js';
import { UserProfileFormAuthenticationService } from './UserProfileFormAuthenticationService.js';

const ChangePassword = importLazyComponent(() => import('./ChangePassword.js').then(m => m.ChangePassword));

@injectable(() => [
  UserProfileTabsService,
  UserInfoResource,
  UserProfileOptionsPanelService,
  UserProfileFormAuthenticationService,
  CommonDialogService,
])
export class UserProfileFormAuthenticationPartBootstrap extends Bootstrap {
  constructor(
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly userInfoResource: UserInfoResource,
    private readonly userProfileOptionsPanelService: UserProfileOptionsPanelService,
    private readonly userProfileFormAuthenticationPartStateService: UserProfileFormAuthenticationService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  override register(): void {
    this.userProfileOptionsPanelService.onClose.addHandler(this.closeHandler.bind(this));
    this.userProfileTabsService.onBeforeTabChange.addHandler(this.tabChangeHandler.bind(this));

    this.userProfileTabsService.tabContainer.add({
      key: 'authentication',
      name: 'ui_authentication',
      order: 4,
      isHidden: () => this.userInfoResource.isAnonymous(),
      panel: () => ChangePassword,
    });
  }

  private async closeHandler(_: unknown, contexts: IExecutionContextProvider<any>): Promise<void> {
    const context = contexts.getContext(userProfileContext);

    if (context.force) {
      this.userProfileFormAuthenticationPartStateService.reset();
      return;
    }

    await this.confirmDiscardChanges(contexts);
  }

  private async tabChangeHandler(_: string, contexts: IExecutionContextProvider<string>): Promise<void> {
    await this.confirmDiscardChanges(contexts);
  }

  private async confirmDiscardChanges(contexts: IExecutionContextProvider<any>): Promise<void> {
    if (!this.userProfileFormAuthenticationPartStateService.isEdited()) {
      return;
    }

    const { status } = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_discard_changes',
      message: 'ui_discard_changes_message',
      confirmActionText: 'ui_discard',
      cancelActionText: 'ui_keep_editing',
    });

    if (status === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
      return;
    }

    this.userProfileFormAuthenticationPartStateService.reset();
  }
}
