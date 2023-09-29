/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export type ControlType = 'checkbox' | 'combobox' | 'link' | 'input' | 'textarea' | 'file';

export function getPropertyControlType(property: ObjectPropertyInfo): ControlType {
  const dataType = property.dataType?.toLowerCase();

  if (dataType === 'boolean') {
    return 'checkbox';
  } else if (property.validValues && property.validValues.length > 0) {
    return 'combobox';
  } else if (property.features.includes('href')) {
    return 'link';
  } else if (dataType === 'string' && property.length === 'MULTILINE') {
    return 'textarea';
  } else if (property.features.includes('file')) {
    return 'file';
  }

  return 'input';
}
