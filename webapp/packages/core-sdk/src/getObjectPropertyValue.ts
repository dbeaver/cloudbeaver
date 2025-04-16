/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@cloudbeaver/core-utils';

export function getObjectPropertyValue(property: ObjectPropertyInfo): any {
  const isBoolean = property.dataType === 'boolean';

  if (!isNotNullDefined(property.value)) {
    return isBoolean ? false : '';
  }

  if (typeof property.value === 'string') {
    return isBoolean ? property.value.toLowerCase() === 'true' : property.value;
  }

  return property.value;
}
