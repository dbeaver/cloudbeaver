/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER } from './NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER';

export function isFolderNodeId(nodeId: string): boolean {
  return NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER.test(nodeId) !== null;
}