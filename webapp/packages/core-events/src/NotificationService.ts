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
  ENotificationType, INotification, INotificationExtraProps, INotificationOptions, NotificationComponent
} from './INotification';

@injectable()
export class NotificationService {
  // todo change to common new Map()
  readonly notificationList = new OrderedMap<number, INotification<any>>(({ id }) => id);
  private notificationNextId = 0;

  get visibleNotifications(): Array<INotification<any>> {
    return this.notificationList.values.filter(notification => !notification.isSilent);
  }

  constructor(
    private settings: EventsSettingsService,
  ) {}

  notify<TProps extends INotificationExtraProps<any> = INotificationExtraProps>(
    options: INotificationOptions<TProps>, type: ENotificationType
  ): void {
    if (options.persistent) {
      const persistentNotifications = this.notificationList.values.filter(value => value.persistent);
      if (persistentNotifications.length >= this.settings.settings.getValue('maxPersistentAllow')) {
        throw new Error(`You cannot create more than ${this.settings.settings.getValue('maxPersistentAllow')} persistent notification`);
      }
    }

    const id = this.notificationNextId++;

    const notification: INotification<TProps> = {
      id,
      title: options.title,
      message: options.message,
      details: options.details,
      isSilent: !!options.isSilent,
      customComponent: options.customComponent,
      extraProps: options.extraProps || {} as TProps,
      persistent: options.persistent,
      type,
      close: this.close.bind(this, id),
      showDetails: this.showDetails.bind(this, id),
    };

    this.notificationList.addValue(notification);

    const filteredNotificationList = this.notificationList.values.filter(notification => !notification.persistent);

    if (filteredNotificationList.length > this.settings.settings.getValue('notificationsPool')) {
      let i = 0;
      while (this.notificationList.get(this.notificationList.keys[i])?.persistent) {
        i++;
      }
      this.notificationList.remove(this.notificationList.keys[i]);
    }
  }

  customNotification<
    TProps extends INotificationExtraProps<any> = INotificationExtraProps
  >(
    component: () => NotificationComponent<TProps>,
    props?: TProps,
    options?: INotificationOptions<TProps> & { type?: ENotificationType }
  ): void {
    this.notify({
      title: '',
      ...options,
      customComponent: component,
      extraProps: props || {} as TProps,
    }, options?.type ?? ENotificationType.Custom);
  }

  logInfo<T>(notification: INotificationOptions<T>): void {
    this.notify(notification, ENotificationType.Info);
  }

  logError<T>(notification: INotificationOptions<T>): void {
    this.notify(notification, ENotificationType.Error);
  }

  logException(exception: Error | GQLError, message?: string, silent?: boolean): void {
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

  close(id: number): void {
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
