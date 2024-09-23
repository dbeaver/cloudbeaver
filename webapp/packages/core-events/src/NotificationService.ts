/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';
import { DetailsError, GQLError } from '@cloudbeaver/core-sdk';
import { errorOf, OrderedMap } from '@cloudbeaver/core-utils';

import { EventsSettingsService } from './EventsSettingsService.js';
import {
  ENotificationType,
  type INotification,
  type INotificationExtraProps,
  type INotificationOptions,
  type INotificationProcessExtraProps,
  type IProcessNotificationContainer,
  type NotificationComponent,
} from './INotification.js';
import { ProcessNotificationController } from './ProcessNotificationController.js';

export const DELAY_DELETING = 1000;
const TIMESTAMP_DIFFERENCE_THRESHOLD = 100;

@injectable()
export class NotificationService {
  // todo change to common new Map()

  readonly notificationList: OrderedMap<number, INotification<any>>;
  readonly closeTask: IExecutor<number>;
  private notificationNextId: number;

  get visibleNotifications(): Array<INotification<any>> {
    return this.notificationList.values.filter(notification => !notification.isSilent);
  }

  constructor(private readonly settings: EventsSettingsService) {
    this.notificationList = new OrderedMap<number, INotification<any>>(({ id }) => id);
    this.closeTask = new Executor();
    this.notificationNextId = 0;
  }

  notify<TProps extends INotificationExtraProps<any> = INotificationExtraProps>(
    options: INotificationOptions<TProps>,
    type: ENotificationType,
  ): INotification<TProps> {
    if (options.persistent) {
      const persistentNotifications = this.notificationList.values.filter(value => value.persistent);

      const maxPersistentAllow = this.settings.maxPersistentAllow;

      if (persistentNotifications.length >= maxPersistentAllow) {
        throw new Error(`You cannot create more than ${maxPersistentAllow} persistent notification`);
      }
    }

    if (options.details !== undefined) {
      const currentTime = options.timestamp || Date.now();
      const previousNotification = this.notificationList.values.reverse().find(notification => notification.details === options.details);

      if (previousNotification) {
        if (currentTime - previousNotification.timestamp < TIMESTAMP_DIFFERENCE_THRESHOLD) {
          return previousNotification;
        }
      }
    }

    if (options.uuid !== undefined) {
      const notification = this.notificationList.values.find(notification => notification.uuid === options.uuid);

      if (notification) {
        return notification;
      }
    }

    const id = this.notificationNextId++;

    const notification: INotification<TProps> = observable(
      {
        id,
        uuid: options.uuid,
        title: options.title,
        message: options.message,
        details: options.details,
        isSilent: !!options.isSilent,
        customComponent: options.customComponent,
        extraProps: options.extraProps || ({} as TProps),
        autoClose: options.autoClose,
        persistent: options.persistent,
        state: observable({ deleteDelay: 0 }),
        timestamp: options.timestamp || Date.now(),
        type,
        close: delayDeleting => {
          this.close(id, delayDeleting);
          options.onClose?.(delayDeleting);
        },
        showDetails: this.showDetails.bind(this, id),
      },
      {
        title: observable.ref,
        message: observable.ref,
        details: observable.ref,
        persistent: observable.ref,
        isSilent: observable.ref,
        customComponent: observable.ref,
        extraProps: observable.ref,
        autoClose: observable.ref,
        type: observable.ref,
        timestamp: observable.ref,
        showDetails: observable.ref,
      },
    );

    this.notificationList.addValue(notification);

    const filteredNotificationList = this.notificationList.values.filter(notification => !notification.persistent);

    const notificationsPool = this.settings.notificationsPool;

    if (filteredNotificationList.length > notificationsPool) {
      let i = 0;
      while (this.notificationList.get(this.notificationList.keys[i]!)?.persistent) {
        i++;
      }
      this.notificationList.remove(this.notificationList.keys[i]!);
    }

    return notification;
  }

  customNotification<TProps extends INotificationExtraProps<any> = INotificationExtraProps>(
    component: () => NotificationComponent<TProps>,
    props?: TProps extends any ? TProps : never, // some magic
    options?: INotificationOptions<TProps> & { type?: ENotificationType },
  ): INotification<TProps> {
    return this.notify(
      {
        title: '',
        ...options,
        customComponent: component,
        extraProps: props || ({} as TProps),
      },
      options?.type ?? ENotificationType.Custom,
    );
  }

  processNotification<TProps extends INotificationProcessExtraProps<any> = INotificationExtraProps>(
    component: () => NotificationComponent<TProps>,
    props?: TProps extends any ? TProps : never, // some magic,
    options?: INotificationOptions<TProps>,
  ): IProcessNotificationContainer<TProps> {
    const processController = props?.state || new ProcessNotificationController();

    const notification = this.notify(
      {
        title: '',
        ...options,
        extraProps: { ...props, state: processController } as TProps,
        customComponent: component,
      },
      ENotificationType.Custom,
    );

    processController.init(notification.title, notification.message);
    return { controller: processController, notification };
  }

  logInfo<T extends INotificationExtraProps<any>>(notification: INotificationOptions<T>): INotification<T> {
    return this.notify(notification, ENotificationType.Info);
  }

  logSuccess<T extends INotificationExtraProps<any>>(notification: INotificationOptions<T>): INotification<T> {
    return this.notify(notification, ENotificationType.Success);
  }

  logError<T extends INotificationExtraProps<any>>(notification: INotificationOptions<T>): INotification<T> {
    return this.notify(notification, ENotificationType.Error);
  }

  logException(exception: Error | GQLError | undefined | null, title?: string, message?: string, silent?: boolean): void {
    const errorDetails = errorOf(exception, DetailsError);

    if (!silent) {
      const hasDetails = errorDetails?.hasDetails() ?? false;

      if (hasDetails) {
        if (!title) {
          title = exception?.name;
        }

        if (!message) {
          message = exception?.message;
        }
      }

      this.logError({
        title: title || 'ui_unexpected_error',
        message: message || 'core_blocks_exception_message_error_message',
        details: exception,
        isSilent: silent,
      });
    }
  }

  throwSilently(exception: Error | GQLError | undefined | null): void {
    this.logError({
      title: '',
      details: exception,
      isSilent: true,
    });
    throw exception;
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
