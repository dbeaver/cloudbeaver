/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { Column as DataGridColumn } from 'react-data-grid';

import type { DBObject } from '@cloudbeaver/core-app';

export interface IDataColumn extends DataGridColumn<DBObject> {
  description?: string;
}

export interface ICustomColumn extends IDataColumn {
  order?: number;
}