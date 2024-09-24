/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { textToHex } from './textToHex.js';

// be careful with this when you calculate a big size blobs
// it can block the main thread and cause freezes
export function base64ToHex(base64String: string): string {
  return textToHex(atob(base64String));
}
