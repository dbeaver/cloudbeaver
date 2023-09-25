/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';

export interface IDatabaseDataOptions {
  connectionKey: IConnectionInfoParams;
  schema?: string;
  catalog?: string;
  /** A raw string representation of the query filter conditions ("id=4") */
  whereFilter: string;
  /** A complex object that can represent filters and sorting options of the result set */
  constraints: SqlDataFilterConstraint[];
  readLogs?: boolean;
}
