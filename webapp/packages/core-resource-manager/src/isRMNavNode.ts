/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RESOURCES_NODE_PATH } from './RESOURCES_NODE_PATH';

export function isRMNavNode(nodeId: string): boolean {
  return nodeId.startsWith(RESOURCES_NODE_PATH);
}