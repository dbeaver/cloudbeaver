/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getSelectedItems<T>(items: Map<T, boolean>): T[] {
  const result: T[] = [];

  for (const [key, value] of items) {
    if (value) {
      result.push(key);
    }
  }

  return result;
}
