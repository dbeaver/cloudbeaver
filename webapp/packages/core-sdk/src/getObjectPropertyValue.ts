/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getObjectPropertyType, type ObjectPropertyType } from './getObjectPropertyType.js';
import type { ObjectPropertyInfo } from './sdk.js';

export function getObjectPropertyValue(property: ObjectPropertyInfo) {
  const controlType = getObjectPropertyType(property);
  return getValue(property.value, controlType);
}

export function getObjectPropertyDefaultValue(property: ObjectPropertyInfo) {
  const controlType = getObjectPropertyType(property);
  return getValue(property.defaultValue, controlType);
}

export function getObjectPropertyDisplayValue(property: ObjectPropertyInfo) {
  const controlType = getObjectPropertyType(property);
  return String(getValue(property.value, controlType));
}

function getValue(value: any, controlType: ObjectPropertyType) {
  const checkbox = controlType === 'checkbox';

  if (value === null || value === undefined) {
    return checkbox ? false : '';
  }

  if (typeof value === 'boolean') {
    return checkbox ? value : String(value);
  }

  if (typeof value === 'string') {
    return checkbox ? value.toLowerCase() === 'true' : value;
  }

  if (Array.isArray(value)) {
    return value.join(', ');
  }

  return value.displayName || value.value || JSON.stringify(value);
}
