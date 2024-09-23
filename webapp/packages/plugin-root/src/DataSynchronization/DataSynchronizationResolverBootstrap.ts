/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ENotificationType, type INotification, NotificationService } from '@cloudbeaver/core-events';
import { DataSynchronizationService, ServerConfigResource } from '@cloudbeaver/core-root';

import { DataSynchronizationNotification } from './DataSynchronizationNotification.js';

@injectable()
export class DataSynchronizationResolverBootstrap extends Bootstrap {
  private activeNotification: INotification | null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly dataSynchronizationService: DataSynchronizationService,
  ) {
    super();
    this.activeNotification = null;
  }

  override register(): void {
    this.dataSynchronizationService.onSynchronizationRequest.addHandler(this.handleNetworkStateChange.bind(this));
  }

  private handleNetworkStateChange(): void {
    if (this.activeNotification || this.serverConfigResource.configurationMode) {
      return;
    }

    this.activeNotification = this.notificationService.customNotification(
      () => DataSynchronizationNotification,
      {},
      {
        title: 'plugin_root_data_sync_title',
        message: 'plugin_root_data_sync_message',
        type: ENotificationType.Info,
        onClose: () => {
          this.dataSynchronizationService.resolveAll(false);
          this.activeNotification = null;
        },
      },
    );
  }
}
