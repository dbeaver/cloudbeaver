/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AdminConnectionGrantInfo } from '@cloudbeaver/core-sdk';

import { AdminConnection } from '../../ConnectionsResource';

export interface IConnectionFormModel {
  connection: AdminConnection;
  credentials: Record<string, string | number>;
  grantedSubjects: AdminConnectionGrantInfo[] | null;
  availableDrivers: string[];
  editing?: boolean;
}
