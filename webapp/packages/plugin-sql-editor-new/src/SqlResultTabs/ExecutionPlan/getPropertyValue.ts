/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export function getPropertyValue(property: ObjectPropertyInfo): string {
  const value = property.value;

  if (!value) {
    return '';
  }

  if (value !== null && typeof value === 'object') {
    return value.displayValue || value.fullName || '';
  }

  return value;
}
