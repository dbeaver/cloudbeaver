/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionResource } from '@cloudbeaver/core-root';
import { WindowsService } from '@cloudbeaver/core-routing';
import { CbServerEventId, type WsOpenUrlEvent } from '@cloudbeaver/core-sdk';

import { SessionActionsEventHandler } from './SessionActionsEventHandler.js';
import { renderUrlConfirmationDetails } from './UrlConfirmationDetails.js';

@injectable(() => [SessionActionsEventHandler, NotificationService, CommonDialogService, WindowsService, SessionResource])
export class CoreSessionActionsBootstrap extends Bootstrap {
  constructor(
    private readonly sessionActionsEventHandler: SessionActionsEventHandler,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly windowsService: WindowsService,
    private readonly sessionResource: SessionResource,
  ) {
    super();

    this.sessionActionsEventHandler.onEvent(CbServerEventId.CbOpenUrl, this.handleOpenUrlEvent.bind(this), undefined, this.sessionResource);
  }

  private async handleOpenUrlEvent(event: WsOpenUrlEvent): Promise<void> {
    const { url, timestamp } = event;

    try {
      const { status } = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'core_session_actions_open_url_title',
        message: 'core_session_actions_open_url_message',
        icon: '/icons/preload/info_icon_sm.svg',
        size: 'medium',
        confirmActionText: 'core_session_actions_open_url_button',
        children: () => renderUrlConfirmationDetails(url),
      });

      if (status === DialogueStateResult.Resolved) {
        const popup = this.windowsService.open(`external-url-${timestamp}`, {
          url,
        });

        if (!popup) {
          this.notificationService.logError({
            title: 'core_session_actions_popup_blocked',
          });
        }
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'core_session_actions_open_url_error');
    }
  }
}
