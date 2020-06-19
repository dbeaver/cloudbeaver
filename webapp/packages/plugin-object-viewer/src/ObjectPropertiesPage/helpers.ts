/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export function getValue(value: string | { displayName: string }) {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value : value.displayName;
}

export function matchType(type?: string) {
  switch (type) {
    case 'boolean':
      return 'checkbox';
    case 'int':
    case 'double':
    case 'long':
      return 'number';
    default:
      return 'text';
  }
}

export function additionalProps(property: ObjectPropertyInfo) {
  const type = matchType(property.dataType);
  if (type !== 'checkbox') {
    return {};
  }
  return { disabled: true, checked: property.value === 'true' };
}

export function filterProperty(property: ObjectPropertyInfo) {
  return true;
}
