/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createService } from '@cloudbeaver/core-di';

import type { IDatabaseDataAction } from '../IDatabaseDataAction.js';
import type { IDatabaseDataResult } from '../IDatabaseDataResult.js';

export interface IDatabaseReferencesAction<TResult extends IDatabaseDataResult = IDatabaseDataResult> extends IDatabaseDataAction<any, TResult> {}

export const IDatabaseReferencesAction = createService<IDatabaseReferencesAction>('IDatabaseReferencesAction');
