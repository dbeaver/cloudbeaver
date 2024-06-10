/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { parseMIME } from '@cloudbeaver/core-utils';

export function getDefaultLineWrapping(mime: string): boolean {
  const parsed = parseMIME(mime);

  // let's just list supported mime types here
  switch (parsed.essence) {
    case 'application/json':
    case 'text/plain':
    case 'text/xml':
    case 'text/html':
    case 'application/octet-stream':
      return true;
    default:
      return true;
  }
}
