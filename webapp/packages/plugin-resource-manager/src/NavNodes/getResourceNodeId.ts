/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IResourceManagerParams } from '@cloudbeaver/core-resource-manager';
import { createPath } from '@cloudbeaver/core-utils';

import { RESOURCES_NODE_PATH } from '../RESOURCES_NODE_PATH';

export function getResourceNodeId(key: IResourceManagerParams): string {
  return createPath(RESOURCES_NODE_PATH, key.projectId, key.path, key.name);
}

export function getResourceParentNodeId(key: IResourceManagerParams): string {
  return createPath(RESOURCES_NODE_PATH, key.projectId, key.path);
}