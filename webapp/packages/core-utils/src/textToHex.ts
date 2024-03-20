/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// be careful with this when you calculate a big size blobs
// it can block the main thread and cause freezes
export function textToHex(raw: string): string {
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : `0${hex}`;
  }
  return result.toUpperCase();
}
