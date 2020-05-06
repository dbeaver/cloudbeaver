/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export enum ENotificationType {
  Info = 'Info',
  Error = 'Error',
  Custom =' Custom'
}

export type NotificationComponentProps<T = undefined> = {
  notification: INotification<T>;
  onClose: () => void;
}
export type NotificationComponent<T = undefined> = React.FunctionComponent<NotificationComponentProps<T>>

export interface INotification<T = undefined> {
  readonly id: number;
  type: ENotificationType;
  title: string;
  message?: string;
  details?: string | Error;
  isSilent: boolean;
  customComponent?: () => NotificationComponent<T>;
  source: T;
  close: () => void;
  showDetails: () => void;
}

export interface INotificationOptions<T = undefined> {
  title: string;
  message?: string;
  details?: string | Error;
  isSilent?: boolean;
  persistent?: boolean;
  customComponent?: () => NotificationComponent<T>;
  source?: T;
}
