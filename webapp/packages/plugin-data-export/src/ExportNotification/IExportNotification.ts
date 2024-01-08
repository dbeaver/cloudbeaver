/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ENotificationType, INotification } from '@cloudbeaver/core-events';

export type IExportNotification = INotification<{ source: string }>;

export interface IExportNotificationStatus {
  title: string;
  status: ENotificationType;
  message?: string;
}
