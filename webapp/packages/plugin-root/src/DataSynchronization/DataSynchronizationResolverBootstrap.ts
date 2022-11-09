/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ActionSnackbar, ActionSnackbarProps } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ENotificationType, INotification, NotificationService } from '@cloudbeaver/core-events';
import { DataSynchronizationService } from '@cloudbeaver/core-root';


@injectable()
export class DataSynchronizationResolverBootstrap extends Bootstrap {
  private activeNotification: INotification<ActionSnackbarProps> | null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataSynchronizationService: DataSynchronizationService
  ) {
    super();
    this.activeNotification = null;
  }

  register(): void {
    this.dataSynchronizationService.onSynchronizationRequest.addHandler(this.handleNetworkStateChange.bind(this));
  }

  load(): void | Promise<void> { }

  private handleNetworkStateChange(): void {
    if (this.activeNotification) {
      return;
    }

    this.activeNotification = this.notificationService.customNotification(() => ActionSnackbar, {
      actionText: 'ui_apply',
      onAction: () => {
        this.dataSynchronizationService.resolveAll(true);
        this.activeNotification?.close(false);
        this.activeNotification = null;
      },
    }, {
      title: 'plugin_root_data_sync_title',
      message: 'plugin_root_data_sync_message',
      type: ENotificationType.Info,
      onClose: () => {
        this.dataSynchronizationService.resolveAll(false);
        this.activeNotification = null;
      },
    });
  }
}
