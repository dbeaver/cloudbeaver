/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ActionSnackbar } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { ServerNodeService } from '@cloudbeaver/core-root';
import { RouterService } from '@cloudbeaver/core-routing';

import { ServerNodeChangedDialog } from './ServerNodeChangedDialog.js';

@injectable()
export class ServerNodeChangedDialogService extends Bootstrap {
  constructor(
    private readonly routerService: RouterService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverNodeService: ServerNodeService,
  ) {
    super();
  }

  override register(): void {
    this.serverNodeService.onApplicationRunIdChange.addPostHandler(this.handleServerNodeChanged.bind(this));
  }

  private async handleServerNodeChanged(): Promise<void> {
    const state = await this.commonDialogService.open(ServerNodeChangedDialog, null);

    if (state === DialogueStateResult.Rejected) {
      this.notificationService.customNotification(
        () => ActionSnackbar,
        {
          actionText: 'ui_processing_reload',
          onAction: () => this.routerService.reload(),
        },
        {
          title: 'app_root_server_node_changed_title',
          message: 'app_root_server_node_changed_message',
          persistent: true,
          type: ENotificationType.Error,
        },
      );
    }
  }
}
