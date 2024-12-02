/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

@injectable()
export class UserLoadingErrorDialogBootstrap extends Bootstrap {
  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super();
    userInfoResource.onException.addHandler(this.handleException.bind(this));
  }

  private async handleException(exception: Error) {
    this.notificationService.logException(exception, 'plugin_authentication_user_loading_error');
    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_authentication_loading_error_dialog_title',
      message: 'plugin_authentication_loading_error_dialog_message',
    });

    if (result === DialogueStateResult.Resolved) {
      await this.userInfoResource.logout();
    }
  }
}
