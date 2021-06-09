/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataAction } from '../IDatabaseDataAction';
import type { IDatabaseDataResult } from '../IDatabaseDataResult';

export interface IDatabaseDataEditAction<TKey, TValue, TResult extends IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  isEdited: () => boolean;
  isElementEdited: (key: TKey) => boolean;
  set: (key: TKey, value: TValue) => void;
  get: (key: TKey) => TValue | undefined;
  revert: (key: TKey) => void;
  clear: () => void;
}
