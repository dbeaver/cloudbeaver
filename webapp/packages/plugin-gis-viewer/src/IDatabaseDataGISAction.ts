/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataResult, IDatabaseDataAction, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

import type { IGISType } from './ResultSetGISAction';

export interface IDatabaseDataGISAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  getGISDataFor: (selectedCells: IResultSetElementKey[]) => IResultSetElementKey[];
  getCellValue: (cell: IResultSetElementKey) => IGISType | undefined;
  isGISFormat: (cell: IResultSetElementKey) => boolean;
}
