/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataResult, IDatabaseDataAction, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

export interface IDatabaseDataGISAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<TResult> {
  getGISDataFor: (selectedCells: Array<Required<IResultSetElementKey>>) => Array<Required<IResultSetElementKey>>;
  isGISFormat: (value: any) => boolean;
}
