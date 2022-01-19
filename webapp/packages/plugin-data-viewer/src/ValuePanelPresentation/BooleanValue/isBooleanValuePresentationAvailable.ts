/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import type { IResultSetValue } from '@cloudbeaver/plugin-data-viewer';

export function isStringifiedBoolean(value: string): boolean {
  return ['false', 'true'].includes(value.toLowerCase());
}

export function isBooleanValuePresentationAvailable(cellValue: IResultSetValue, column: SqlResultColumn): boolean {
  return column?.dataKind?.toLowerCase() === 'boolean'
    && (
      typeof cellValue === 'boolean'
      || cellValue === null
      || (typeof cellValue === 'string' && isStringifiedBoolean(cellValue))
    );
}
