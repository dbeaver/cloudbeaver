/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isStringifiedBoolean } from './isBooleanValuePresentationAvailable.js';

export function preprocessBooleanValue(cellValue: unknown): boolean | null | undefined {
  if (typeof cellValue === 'string' && isStringifiedBoolean(cellValue)) {
    return cellValue.toLowerCase() === 'true';
  }

  if (typeof cellValue === 'boolean' || cellValue === null) {
    return cellValue;
  }

  return undefined;
}
