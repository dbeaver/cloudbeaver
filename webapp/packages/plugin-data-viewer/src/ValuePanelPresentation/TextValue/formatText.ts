/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { textToHex } from '@cloudbeaver/core-utils';

export function formatText(type: string, value: string) {
  try {
    switch (type) {
      case 'application/json':
        return JSON.stringify(JSON.parse(value), null, 2);
      case 'text/xml':
      case 'text/html':
        return value;
      case 'application/octet-stream;type=hex':
        return textToHex(value);
      case 'application/octet-stream;type=base64':
      case 'application/octet-stream':
        return btoa(value);
      default:
        return value;
    }
  } catch {
    return value;
  }
}
