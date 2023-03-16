/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPath } from './createPath';
import { getPathParts } from './getPathParts';

export function getPathParents(path: string): string[] {
  const parts = getPathParts(path);

  return parts.map((_, i, array) => createPath(...array.slice(0, i)));
}