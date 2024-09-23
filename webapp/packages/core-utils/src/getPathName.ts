/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getPathParts } from './getPathParts.js';

export function getPathName(path: string) {
  const parts = getPathParts(path);
  return parts[parts.length - 1]!;
}
