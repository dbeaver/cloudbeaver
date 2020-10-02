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
  readonly notificationList = new OrderedMap<number, INotification<any, any>>(({ id }) => id);
  private notificationNextId = 0
  private maxPersistentAllow = 1

  constructor(
    private settings: EventsSettingsService,
  ) {}

  notify<T = never, TProps = Record<string, any>>(options: INotificationOptions<T, TProps>, type: ENotificationType) {
    const id = this.notificationNextId++;

    const notification: INotification<T, TProps> = {
      id,
      title: options.title,
      message: options.message,
      details: options.details,
      isSilent: !!options.isSilent,
      customComponent: options.customComponent,
      extraProps: options.extraProps || {} as TProps,
      source: options.source!,
      persistent: options.persistent,
      type,
      close: this.close.bind(this, id),
      showDetails: this.showDetails.bind(this, id),
    };
    const persistent = this.notificationList.values.filter(value => value.persistent);
    const persistentQty = persistent.length;
    if (persistentQty >= this.maxPersistentAllow && notification.persistent) {
      return;
    }
    this.notificationList.addValue(notification);

    const filteredNotificationList = this.notificationList.values.filter(notification => !notification.persistent);

    if (filteredNotificationList.length > this.settings.settings.getValue('notificationsPool')) {
      if (this.notificationList.get(this.notificationList.keys[0])?.persistent) {
        if (this.maxPersistentAllow > 1) {
          let i = 1;
          while (this.notificationList.get(this.notificationList.keys[i])?.persistent) {
            i++;
          }
          this.notificationList.remove(this.notificationList.keys[i]);
          return;
        }
        this.notificationList.remove(this.notificationList.keys[1]);
        return;
      }
      this.notificationList.remove(this.notificationList.keys[0]);

    }
  }

  customNotification<T = never, TProps = Record<string, any>>(
    type: ENotificationType,
    component: () => NotificationComponent<T, TProps>,
    props?: TProps,
    source?: T,
    options?: INotificationOptions<T, TProps>
  ) {
    this.notify({
      title: '',
      ...options,
      customComponent: component,
      extraProps: props || {} as TProps,
      source,
    }, type);
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
