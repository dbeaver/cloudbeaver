/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { GQLError, ServerInternalError } from '@dbeaver/core/sdk';
import { OrderedMap } from '@dbeaver/core/utils';

import {
  ENotificationType, INotification, INotificationOptions, NotificationComponent
} from './INotification';

@injectable()
export class NotificationService {
  readonly notificationList = new OrderedMap<number, INotification<any>>(({ id }) => id);
  private notificationNextId = 0

  notify<T = never>(options: INotificationOptions<T>, type: ENotificationType) {
    const id = this.notificationNextId++;

    const notification: INotification<T> = {
      id,
      title: options.title,
      message: options.message,
      details: options.details,
      isSilent: !!options.isSilent,
      customComponent: options.customComponent,
      source: options.source!,
      type,
      close: this.close.bind(this, id),
      showDetails: this.showDetails.bind(this, id),
    };
    this.notificationList.addValue(notification);
  }

  customNotification<T = never>(
    component: () => NotificationComponent<T>,
    source?: T,
    options?: INotificationOptions<T>
  ) {
    this.notify({
      title: '',
      ...options,
      customComponent: component,
      source,
    }, ENotificationType.Custom);
  }

  logInfo<T>(notification: INotificationOptions<T>) {
    this.notify(notification, ENotificationType.Info);
  }

  logError<T>(notification: INotificationOptions<T>) {
    this.notify(notification, ENotificationType.Error);
  }

  logException(exception: Error, message?: string, silent?: boolean) {
    if (!silent) {
      this.logError({
        title: message || exception.message || exception.name,
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
