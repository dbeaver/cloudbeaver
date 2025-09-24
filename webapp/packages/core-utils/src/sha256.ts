/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Sha256 } from '@aws-crypto/sha256-browser';

export async function sha256(str: string): Promise<string> {
  const hash = await new Sha256(str).digest();
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(hash);
}
