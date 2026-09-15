/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IObjectPropertyInfo } from '@cloudbeaver/core-sdk';

interface PreparePropertiesParams {
  engineProperties: Record<string, any>;
  initialEngineProperties: Record<string, any>;
  infoProperties: IObjectPropertyInfo[];
}

export function prepareProperties({ engineProperties, initialEngineProperties, infoProperties }: PreparePropertiesParams): Record<string, any> {
  const result: Record<string, any> = {};
  const passwordsProperties = infoProperties.filter(property => property.features.includes('password'));

  for (const key of Object.keys(engineProperties)) {
    let value = engineProperties[key];
    const initial = initialEngineProperties[key];

    if (typeof value === 'string') {
      value = value.trim();
    }

    if (initial !== value) {
      result[key] = value;
    }
  }

  for (const passwordProperty of passwordsProperties) {
    const id = passwordProperty.id;

    if (!id) {
      continue;
    }

    const password = result[id];

    if (!password || typeof password !== 'string') {
      continue;
    }

    if (password.split('').every(char => char === '*')) {
      delete result[id];
    }
  }

  return result;
}
