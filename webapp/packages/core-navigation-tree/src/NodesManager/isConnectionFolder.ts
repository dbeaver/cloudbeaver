/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode } from './EntityTypes.js';
import { NAV_NODE_TYPE_FOLDER } from './NAV_NODE_TYPE_FOLDER.js';

export function isConnectionFolder(node: NavNode | undefined): boolean {
  return node?.nodeType === NAV_NODE_TYPE_FOLDER;
}
