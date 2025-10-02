/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import md5 from 'md5';
import { sha256 } from './sha256.js';

export async function createHash(value: string, algorithm: 'md5' | 'sha256'): Promise<string> {
  if (algorithm === 'sha256') {
    const hash = await sha256(value);
    return hash.toUpperCase();
  }

  return md5(value).toUpperCase();
}
