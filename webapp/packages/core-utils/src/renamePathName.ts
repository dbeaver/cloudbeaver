/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { createPath } from './createPath';
import { getPathParent } from './getPathParent';

export function renamePathName(path: string, name: string): string {
  return createPath(getPathParent(path), name);
}
