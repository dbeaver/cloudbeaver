/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncExecutor } from '@cloudbeaver/core-executor';

import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';
import { createService } from '@cloudbeaver/core-di';

export type DatabaseDataSelectActionsData<TKey> =
  | {
      type: 'select';
      resultId: string | null;
      key: TKey;
      selected: boolean;
    }
  | {
      type: 'focus';
      resultId: string | null;
      key: TKey | null;
    }
  | {
      type: 'clear';
      resultId: string | null;
    };

export interface IDatabaseDataSelectAction<TKey = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  readonly actions: ISyncExecutor<DatabaseDataSelectActionsData<TKey>>;
  isSelected: () => boolean;
  isElementSelected: (key: TKey) => boolean;
  isFocused(key: TKey): boolean;
  getFocusedElement: () => TKey | null;
  getSelectedElements(): TKey[];
  getActiveElements(): TKey[];
  set: (key: TKey, selected: boolean) => void;
  focus(key: TKey | null): void;
  clear: () => void;
}

export const IDatabaseDataSelectAction = createService<IDatabaseDataSelectAction>('IDatabaseDataSelectAction');
