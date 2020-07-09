/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GQLError, ServerInternalError } from '@cloudbeaver/core-sdk';
import { OrderedMap } from '@cloudbeaver/core-utils';

import { EventsSettingsService } from './EventsSettingsService';
import {
  ENotificationType, INotification, INotificationOptions, NotificationComponent
} from './INotification';

@injectable()
export class NotificationService {
  readonly notificationList = new OrderedMap<number, INotification<any>>(({ id }) => id);
  private notificationNextId = 0

  constructor(
    private settings: EventsSettingsService,
  ) {}

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

    if (this.notificationList.values.length > this.settings.settings.getValue('notificationsPool')) {
      this.notificationList.remove(this.notificationList.keys[0]);
    }
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

  logException(exception: Error | GQLError, message?: string, silent?: boolean) {
    const exceptionMessage = hasDetails(exception) ? exception.errorText : exception.message || exception.name;
    if (!silent) {
      this.logError({
        title: message || exceptionMessage,
        details: hasDetails(exception) ? exception : undefined,
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
}

function hasDetails(error: Error): error is GQLError | ServerInternalError {
  return error instanceof GQLError || error instanceof ServerInternalError;
}
