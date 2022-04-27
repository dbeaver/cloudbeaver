/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

type Value = string | null | undefined | { displayName: string } | string[];

export function getValue(value: Value): string {
  if (value === null || value === undefined) {
    return '';
  }

  switch (typeof value) {
    case 'string':
      return value;
    case 'object':
      return Array.isArray(value) ? value.join(', ') : value.displayName;
    default:
      return '';
  }
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

export function filterProperty(property: ObjectPropertyInfo): boolean {
  return true;
}
