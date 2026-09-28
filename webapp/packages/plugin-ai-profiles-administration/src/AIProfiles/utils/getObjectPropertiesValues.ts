/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getObjectPropertyValue, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export function getObjectPropertiesValues(properties: IObjectPropertyInfo[]): Record<string, any> {
  const result: Record<string, any> = {};

  for (const property of properties) {
    if (property.id && property.value !== undefined) {
      result[property.id] = getObjectPropertyValue(property);
    }
  }

  return result;
}
