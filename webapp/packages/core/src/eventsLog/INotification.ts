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
}

export interface INotification {
  readonly id: number;
  type: ENotificationType;
  title: string;
  message?: string;
  details?: string | Error;
  isSilent: boolean;
  close: () => void;
  showDetails: () => void;
}

export interface INotificationOptions {
  title: string;
  message?: string;
  details?: string | Error;
  isSilent?: boolean;
}
