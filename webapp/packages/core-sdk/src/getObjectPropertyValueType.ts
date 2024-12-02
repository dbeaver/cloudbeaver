/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ObjectPropertyInfo } from './sdk.js';

export type ObjectPropertyValueType = 'password' | 'text' | 'number';

export function getObjectPropertyValueType(property: ObjectPropertyInfo): ObjectPropertyValueType | undefined {
  const dataType = property.dataType?.toLowerCase();

  if (property.features.includes('password')) {
    return 'password';
  }

  if (dataType === 'integer') {
    return 'number';
  }

  return dataType === 'string' ? 'text' : undefined;
}
