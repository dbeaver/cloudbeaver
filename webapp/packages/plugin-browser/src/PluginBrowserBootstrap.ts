/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ProcessSnackbarProps } from '@cloudbeaver/core-blocks';
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { type IProcessNotificationContainer, NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';

@injectable()
export class PluginBrowserBootstrap extends Bootstrap {
  private notification: IProcessNotificationContainer<ProcessSnackbarProps> | null;

  constructor(
    private readonly serviceWorkerService: ServiceWorkerService,
    private readonly notificationService: NotificationService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.notification = null;
  }
  override register(): void {
    // TODO: notification appears in unexpected moment
    // this.serviceWorkerService.onUpdate.addHandler(({ type, progress }) => {
    //   progress = progress || 0;
    //   switch (type) {
    //     case 'installing':
    //       break;
    //     case 'updating':
    //       if (!this.notification) {
    //         this.notification = this.notificationService.processNotification(
    //           () => ProcessSnackbar,
    //           {},
    //           {
    //             title: 'plugin_browser_update_dialog_title',
    //             message: this.localizationService.translate('plugin_browser_update_dialog_message', undefined, { progress: '0%' }),
    //           },
    //         );
    //       }
    //       this.notification.controller.setMessage(
    //         this.localizationService.translate('plugin_browser_update_dialog_message', undefined, { progress: (progress * 100).toFixed(0) + '%' }),
    //       );
    //       break;
    //     case 'finished':
    //       this.notification?.notification.close();
    //       this.notification = null;
    //       break;
    //   }
    // });
  }
}
