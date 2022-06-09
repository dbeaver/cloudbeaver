/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ActionSnackbar } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { SessionExpireService } from '@cloudbeaver/core-root';

import { SessionExpiredDialog } from './SessionExpiredDialog';

@injectable()
export class SessionExpiredDialogService extends Bootstrap {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sessionExpireService: SessionExpireService
  ) {
    super();
  }

  register(): void {
    this.sessionExpireService.onSessionExpire.addPostHandler(this.handleSessionExpired.bind(this));
  }

  load(): void | Promise<void> { }

  private async handleSessionExpired(): Promise<void> {
    const state = await this.commonDialogService.open(SessionExpiredDialog, null);

    if (state === DialogueStateResult.Rejected) {
      this.notificationService.customNotification(() => ActionSnackbar, {
        actionText: 'app_root_session_expired_reload',
        onAction: () => location.reload(),
      }, { title: 'app_root_session_expired_title', persistent: true, type: ENotificationType.Error });
    }
  }
}
