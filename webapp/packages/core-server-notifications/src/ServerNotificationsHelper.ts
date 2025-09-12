/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { WsUserNotificationEventType, type WsUserNotificationEvent } from '@cloudbeaver/core-sdk';
import { type INotificationOptions, ENotificationType } from './INotification.js';

export const ServerNotificationsHelper = {
  mapEventToNotification(event: WsUserNotificationEvent): INotificationOptions {
    return {
      message: event.message,
      title: event.title ?? '',
    };
  },
  mapNotificationType(serverType: WsUserNotificationEventType): ENotificationType {
    const map = {
      [WsUserNotificationEventType.Info]: ENotificationType.Info,
      [WsUserNotificationEventType.Error]: ENotificationType.Error,
      [WsUserNotificationEventType.Loading]: ENotificationType.Loading,
      [WsUserNotificationEventType.Custom]: ENotificationType.Custom,
    };

    return map[serverType] || ENotificationType.Info;
  },
};
