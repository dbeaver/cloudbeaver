/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getObjectPropertyType, type ObjectPropertyType } from './getObjectPropertyType.js';
import type { IObjectPropertyInfo, ObjectPropertyOption, ObjectPropertyOptionValue } from './IObjectPropertyInfo.js';

export function getObjectPropertyValue(property: IObjectPropertyInfo) {
  const controlType = getObjectPropertyType(property);
  return getValue(property.value, controlType);
}

export function getObjectPropertyDefaultValue(property: IObjectPropertyInfo) {
  const controlType = getObjectPropertyType(property);
  return getValue(property.defaultValue, controlType);
}

export function getObjectPropertyDisplayValue(property: IObjectPropertyInfo) {
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

  return value.value || value.displayName || JSON.stringify(value);
}

export function getObjectPropertyOptionValue(option: ObjectPropertyOption): ObjectPropertyOptionValue {
  if (typeof option === 'object' && option !== null) {
    return option.value;
  }

  return option;
}

export function getObjectPropertyOptionName(option: ObjectPropertyOption): string {
  if (typeof option === 'object' && option !== null) {
    return option.displayName;
  }

  if (option === null || option === undefined) {
    return '';
  }

  return String(option);
}
