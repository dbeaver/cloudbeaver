/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ActionSnackbar } from '@cloudbeaver/core-blocks';
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';

@injectable()
export class PluginBrowserBootstrap extends Bootstrap {
  constructor(
    private readonly serviceWorkerService: ServiceWorkerService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }
  register(): void | Promise<void> {
    this.serviceWorkerService.onUpdate.addHandler(async (_, context) => {
      const result = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'plugin_browser_update_dialog_title',
        message: 'plugin_browser_update_dialog_message',
      });

      if (result === DialogueStateResult.Resolved) {
        return;
      }

      this.notificationService.customNotification(
        () => ActionSnackbar,
        {
          actionText: 'ui_processing_reload',
          onAction: () => window.location.reload(),
        },
        { title: 'plugin_browser_update_dialog_title', persistent: true, type: ENotificationType.Info },
      );

      ExecutorInterrupter.interrupt(context);
    });
  }

  load(): void | Promise<void> {}
}
