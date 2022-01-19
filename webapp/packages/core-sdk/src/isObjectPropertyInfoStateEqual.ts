/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { isValuesEqual } from '@cloudbeaver/core-utils';

import type { ObjectPropertyInfo } from './sdk';

type RequiredObjectPropertyInfoFields = Pick<ObjectPropertyInfo, 'id' | 'defaultValue'>;

export function isObjectPropertyInfoStateEqual<T>(
  properties: RequiredObjectPropertyInfoFields[],
  first: T,
  second: T
): boolean {
  if (
    first === null
    || second === null
    || typeof first !== 'object'
    || typeof second !== 'object'
  ) {
    return false;
  }

  const customKeys = [...Object.keys(first), ...Object.keys(second)]
    .filter(key => !properties.some(property => key === property.id));

  for (const property of properties) {
    if (!property.id) {
      continue;
    }

    if (!isValuesEqual(first[property.id as keyof T], second[property.id as keyof T], property.defaultValue)) {
      return false;
    }
  }

  for (const key of customKeys) {
    if (first[key as keyof T] !== second[key as keyof T]) {
      return false;
    }
  }

  return true;
}
