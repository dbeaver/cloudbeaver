/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IConnectionFolderParam } from '../ConnectionFolderResource.js';
import { createConnectionFolderParam } from '../createConnectionFolderParam.js';

export function getConnectionFolderIdFromNodeId(nodeId: string): IConnectionFolderParam | undefined {
  const prefix = 'folder://';

  if (!nodeId.startsWith(prefix)) {
    return;
  }

  const body = nodeId.slice(prefix.length);
  const slashPos = body.indexOf('/');

  if (slashPos === -1) {
    return;
  }

  const projectId = body.slice(0, slashPos);
  const folderId = body.slice(slashPos + 1);

  return createConnectionFolderParam(projectId, folderId);
}
