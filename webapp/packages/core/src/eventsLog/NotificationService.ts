/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { GQLError, ServerInternalError } from '@dbeaver/core/sdk';
import { OrderedMap } from '@dbeaver/core/utils';

import { ENotificationType, INotification, INotificationOptions } from './INotification';

@injectable()
export class NotificationService {
  private notificationList = new OrderedMap<number, INotification>();
  private notificationNextId = 0

  /**
   * By default filtered without silent notifications
   */
  @computed get notifications(): INotification[] {
    return this.notificationList.values
      .filter(notification => !notification.isSilent);
  }

  notify(options: INotificationOptions, type: ENotificationType) {
    const id = this.notificationNextId++;

    const notification: INotification = {
      id,
      title: options.title,
      message: options.message,
      details: options.details,
      isSilent: !!options.isSilent,
      type,
      close: this.close.bind(this, id),
      showDetails: this.showDetails.bind(this, id),
    };
    this.notificationList.add(notification.id, notification);
  }

  logInfo(notification: INotificationOptions) {
    this.notify(notification, ENotificationType.Info);
  }

  logError(notification: INotificationOptions) {
    this.notify(notification, ENotificationType.Error);
  }

  logException(exception: Error, message?: string, silent?: boolean) {
    if (!silent) {
      this.logError({
        title: message || exception.name,
        details: this.hasDetails(exception) ? exception : undefined,
        isSilent: silent,
      });
    }

    console.error(exception);
  }

  close(id: number) {
    // TODO: emit event or something

    this.notificationList.remove(id);
  }

  showDetails(id: number): void {
    // TODO: emit event or something
  }

  private hasDetails(error: Error) {
    return error instanceof GQLError || error instanceof ServerInternalError;
  }
}
