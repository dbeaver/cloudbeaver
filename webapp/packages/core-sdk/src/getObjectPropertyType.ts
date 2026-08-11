/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IObjectPropertyInfo } from './IObjectPropertyInfo.js';

export type ObjectPropertyType = 'checkbox' | 'selector' | 'link' | 'textarea' | 'file' | 'input' | 'uploadable-textarea';

export function getObjectPropertyType(property: IObjectPropertyInfo): ObjectPropertyType {
  const dataType = property.dataType?.toLowerCase();
  const isTextarea = dataType === 'string' && property.length === 'MULTILINE';
  const isFile = property.features.includes('file');

  if (dataType === 'boolean') {
    return 'checkbox';
  } else if (property.validValues && property.validValues.length > 0) {
    return 'selector';
  } else if (property.features.includes('href')) {
    return 'link';
  } else if (isTextarea && isFile) {
    return 'uploadable-textarea';
  } else if (isTextarea) {
    return 'textarea';
  } else if (isFile) {
    return 'file';
  }

  return 'input';
}
