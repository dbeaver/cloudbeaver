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
  Success = 'Success',
  Custom =' Custom'
}

export interface INotificationExtraProps<T = never> {
  source?: T;
  [key: string]: any;
}

export type NotificationComponentProps<
  TProps extends INotificationExtraProps<any> = INotificationExtraProps
> = TProps & {
  notification: INotification<TProps>;
  onClose: () => void;
};

export type NotificationComponent<
  TProps extends INotificationExtraProps<any> = INotificationExtraProps,
> = React.FunctionComponent<NotificationComponentProps<TProps>>;

export interface INotification<TProps extends INotificationExtraProps<any> = INotificationExtraProps> {
  readonly id: number;
  type: ENotificationType;
  title: string;
  message?: string;
  createdAt?: number;
  details?: string | Error;
  persistent?: boolean;
  isSilent: boolean;
  extraProps: TProps;
  customComponent?: () => NotificationComponent<TProps>;
  close: () => void;
  showDetails: () => void;
}

export interface INotificationOptions<TProps extends INotificationExtraProps<any> = INotificationExtraProps> {
  title: string;
  message?: string;
  details?: string | Error;
  isSilent?: boolean;
  persistent?: boolean;
  extraProps?: TProps;
  createdAt?: number;
  customComponent?: () => NotificationComponent<TProps>;
}
