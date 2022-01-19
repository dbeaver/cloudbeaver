/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import { getErrorDetails, GQLError } from '@cloudbeaver/core-sdk';
import { OrderedMap } from '@cloudbeaver/core-utils';

import { EventsSettingsService } from './EventsSettingsService';
import {
  ENotificationType,
  INotification,
  INotificationExtraProps,
  INotificationOptions,
  NotificationComponent,
  INotificationProcessExtraProps,
  IProcessNotificationContainer
} from './INotification';
import { ProcessNotificationController } from './ProcessNotificationController';

export const DELAY_DELETING = 1000;
@injectable()
export class NotificationService {
  // todo change to common new Map()

  readonly notificationList: OrderedMap<number, INotification<any>>;
  readonly closeTask: IExecutor<number>;
  private notificationNextId: number;

  get visibleNotifications(): Array<INotification<any>> {
    return this.notificationList.values.filter(notification => !notification.isSilent);
  }

  constructor(
    private settings: EventsSettingsService
  ) {
    this.notificationList = new OrderedMap<number, INotification<any>>(({ id }) => id);
    this.closeTask = new Executor();
    this.notificationNextId = 0;
  }

  notify<TProps extends INotificationExtraProps<any> = INotificationExtraProps>(
    options: INotificationOptions<TProps>, type: ENotificationType
  ): INotification<TProps> {
    if (options.persistent) {
      const persistentNotifications = this.notificationList.values.filter(value => value.persistent);
      if (persistentNotifications.length >= this.settings.settings.getValue('maxPersistentAllow')) {
        throw new Error(`You cannot create more than ${this.settings.settings.getValue('maxPersistentAllow')} persistent notification`);
      }
    }

    if (options.uuid !== undefined) {
      const notification = this.notificationList.values.find(notification => notification.uuid === options.uuid);

      if (notification) {
        return notification;
      }
    }

    const id = this.notificationNextId++;

    const notification: INotification<TProps> = {
      id,
      uuid: options.uuid,
      title: options.title,
      message: options.message,
      details: options.details,
      isSilent: !!options.isSilent,
      customComponent: options.customComponent,
      extraProps: options.extraProps || {} as TProps,
      persistent: options.persistent,
      state: observable({ deleteDelay: 0 }),
      timestamp: options.timestamp || Date.now(),
      type,
      close: delayDeleting => {
        this.close(id, delayDeleting);
        options.onClose?.(delayDeleting);
      },
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

    return notification;
  }

  customNotification<
    TProps extends INotificationExtraProps<any> = INotificationExtraProps
  >(
    component: () => NotificationComponent<TProps>,
    props?: TProps extends any ? TProps : never, // some magic
    options?: INotificationOptions<TProps> & { type?: ENotificationType }
  ): INotification<TProps> {
    return this.notify({
      title: '',
      ...options,
      customComponent: component,
      extraProps: props || {} as TProps,
    }, options?.type ?? ENotificationType.Custom);
  }

  processNotification<
    TProps extends INotificationProcessExtraProps<any> = INotificationExtraProps>(
    component: () => NotificationComponent<TProps>,
    props?: TProps extends any ? TProps : never, // some magic,
    options?: INotificationOptions<TProps>
  ): IProcessNotificationContainer<TProps> {
    const processController = props?.state || new ProcessNotificationController();

    const notification = this.notify({
      title: '',
      ...options,
      extraProps: { ...props, state: processController } as TProps,
      customComponent: component,
    }, ENotificationType.Custom);

    processController.init(notification.title, notification.message);
    return { controller: processController, notification };
  }

  logInfo<T>(notification: INotificationOptions<T>): INotification<T> {
    return this.notify(notification, ENotificationType.Info);
  }

  logSuccess<T>(notification: INotificationOptions<T>): INotification<T> {
    return this.notify(notification, ENotificationType.Success);
  }

  logError<T>(notification: INotificationOptions<T>): INotification<T> {
    return this.notify(notification, ENotificationType.Error);
  }

  logException(exception: Error | GQLError, title?: string, message?: string, silent?: boolean): void {
    const errorDetails = getErrorDetails(exception);

    if (!silent) {
      this.logError({
        title: title || errorDetails.name,
        message: message || errorDetails.message,
        details: errorDetails.hasDetails ? exception : undefined,
        isSilent: silent,
      });
    }

    console.error(exception);
  }

  close(id: number, delayDeleting = true): void {
    // TODO: emit event or something

    if (delayDeleting) {
      const notification = this.notificationList.get(id);

      if (notification) {
        notification.state.deleteDelay = DELAY_DELETING;
        setTimeout(() => {
          this.notificationList.remove(id);
          this.closeTask.execute(id);
        }, DELAY_DELETING);
      }
      return;
    }
    this.notificationList.remove(id);
    this.closeTask.execute(id);
  }

  showDetails(id: number): void {
    // TODO: emit event or something
  }
}
