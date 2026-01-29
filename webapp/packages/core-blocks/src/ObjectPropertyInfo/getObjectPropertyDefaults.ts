/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getObjectPropertyDefaultValue, type IObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';

export function getObjectPropertyDefaults(properties: ReadonlyArray<IObjectPropertyInfo>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const property of properties) {
    const isDefault = isNotNullDefined(property.defaultValue);

    if (isDefault && property.id) {
      result[property.id] = getObjectPropertyDefaultValue(property);
    }
  }

  return result;
}
