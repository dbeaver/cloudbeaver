/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function getSelectedItems(items: Map<any, boolean>): any[] {
  const result: any[] = [];

  for (const [key, value] of items) {
    if (value) {
      result.push(key);
    }
  }

  return result;
}
