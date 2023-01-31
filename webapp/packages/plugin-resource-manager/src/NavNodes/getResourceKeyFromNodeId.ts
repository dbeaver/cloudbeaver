/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { IResourceManagerParams, isRMNavNode } from '@cloudbeaver/core-resource-manager';

export function getResourceKeyFromNodeId(nodeId: string): IResourceManagerParams | undefined {
  if (!isRMNavNode(nodeId)) {
    return;
  }

  const parts = nodeId.replace('//', '\\').split('/');
  const projectId = parts[1];
  const path = parts.slice(2, parts.length - 1).join('/');
  let name: string | undefined;

  if (parts.length > 2) {
    name = parts[parts.length - 1];
  }

  return { projectId, path, name };
}