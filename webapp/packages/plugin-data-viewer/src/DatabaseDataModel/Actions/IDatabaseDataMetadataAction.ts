/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createService } from '@cloudbeaver/core-di';
import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';

export interface IDatabaseDataMetadataAction<TKey = unknown, TResult extends IDatabaseDataResult = IDatabaseDataResult>
  extends IDatabaseDataAction<any, TResult> {
  get<T>(key: string): T | undefined;
  get<T>(key: string, getDefaultValue: () => T): T;
  set(key: string, value: any): void;
  delete(key: string): void;
  has(key: string): boolean;
}

export const IDatabaseDataMetadataAction = createService<IDatabaseDataMetadataAction>('IDatabaseDataMetadataAction');
