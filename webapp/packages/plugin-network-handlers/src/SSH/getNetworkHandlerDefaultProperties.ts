/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NetworkHandlerDescriptor } from '@cloudbeaver/core-sdk';

export function getNetworkHandlerDefaultProperties(handler: NetworkHandlerDescriptor): Record<string, any> {
  const properties: Record<string, any> = {};
  for (const property of handler.properties) {
    if (!property.features.includes('password')) {
      properties[property.id!] = property.value;
    }
  }
  return properties;
}
