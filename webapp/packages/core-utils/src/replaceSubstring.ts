/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function replaceSubstring(str: string, beginIndex: number, endIndex: number, replacement: string) {
  const beforeSubstring = str.slice(0, beginIndex);
  const afterSubstring = str.slice(endIndex);
  return beforeSubstring + replacement + afterSubstring;
}
