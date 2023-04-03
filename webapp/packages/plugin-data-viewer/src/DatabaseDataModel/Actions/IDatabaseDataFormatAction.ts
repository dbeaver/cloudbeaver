/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';

export interface IDatabaseDataFormatAction<TKey, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  isReadOnly: (key: TKey) => boolean;
  get: (value: any) => any;
  getText: (value: any) => string | null;
  isNull: (value: any) => boolean;
  toDisplayString: (value: any) => string;
}
