/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function trimObjectValues(object: object | undefined): void {
  if (!object) {
    return;
  }

  const values = object as Record<string, unknown>;

  for (const key of Object.keys(values)) {
    const value = values[key];

    if (typeof value === 'string') {
      values[key] = value.trim();
    }
  }
}
