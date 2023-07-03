/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ProcessSnackbar } from '@cloudbeaver/core-blocks';
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

@injectable()
export class PluginBrowserBootstrap extends Bootstrap {
  constructor(private readonly serviceWorkerService: ServiceWorkerService, private readonly notificationService: NotificationService) {
    super();
  }
  register(): void | Promise<void> {
    this.serviceWorkerService.onUpdate.addHandler(() => {
      this.notificationService.processNotification(() => ProcessSnackbar, {}, { title: 'plugin_browser_update_dialog_title' });
    });
  }

  load(): void | Promise<void> {}
}
