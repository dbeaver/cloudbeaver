/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function setByPath(object: any, path: string, value: any) {
  const parts = path.split('.');
  const last = parts.pop();

  if (!last) {
    return;
  }

  let current = object;

  for (const part of parts) {
    if (current[part] === undefined) {
      current[part] = {};
    }
    current = current[part];
  }

  current[last] = value;
}
