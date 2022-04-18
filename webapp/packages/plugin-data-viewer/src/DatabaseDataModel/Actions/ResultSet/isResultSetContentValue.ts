/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IResultSetContentValue } from './IResultSetContentValue';

export function isResultSetContentValue(value: any): value is IResultSetContentValue {
  return value !== null
    && typeof value === 'object'
    && '$type' in value
    && value.$type === 'content';
}