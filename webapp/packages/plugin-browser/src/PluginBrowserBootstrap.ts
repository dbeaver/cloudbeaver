/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ProcessSnackbar, ProcessSnackbarProps } from '@cloudbeaver/core-blocks';
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { IProcessNotificationContainer, NotificationService } from '@cloudbeaver/core-events';

@injectable()
export class PluginBrowserBootstrap extends Bootstrap {
  private notification: IProcessNotificationContainer<ProcessSnackbarProps> | null;

  constructor(
    private readonly serviceWorkerService: ServiceWorkerService,
    private readonly notificationService: NotificationService,
  ) {
    super();
    this.notification = null;
  }
  register(): void {
    this.serviceWorkerService.onUpdate.addHandler(progress => {
      if (!this.notification) {
        this.notification = this.notificationService.processNotification(() => ProcessSnackbar, {}, { title: 'plugin_browser_update_dialog_title' });
      }

      this.notification.controller.setMessage(progress * 100 + '%');
    });
  }
}
