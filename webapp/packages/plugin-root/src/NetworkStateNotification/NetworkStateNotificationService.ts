/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { type INotification, NotificationService } from '@cloudbeaver/core-events';
import { NetworkStateService } from '@cloudbeaver/core-root';

@injectable()
export class NetworkStateNotificationService extends Bootstrap {
  private activeNotification: INotification | null;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly networkStateService: NetworkStateService,
  ) {
    super();
    this.activeNotification = null;
  }

  override register(): void {
    this.networkStateService.networkStateExecutor.addHandler(this.handleNetworkStateChange.bind(this));
  }

  private handleNetworkStateChange(state: boolean): void {
    if (!state) {
      if (this.activeNotification) {
        return;
      }

      this.activeNotification = this.notificationService.logInfo({
        title: 'plugin_root_network_state_title',
        message: 'plugin_root_network_state_description',
        persistent: true,
      });
    } else {
      this.activeNotification?.close(true);
      this.activeNotification = null;
    }
  }
}
