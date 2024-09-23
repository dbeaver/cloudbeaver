/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getProjectNodeId } from '@cloudbeaver/core-projects';

import { getConnectionFolderId } from './getConnectionFolderId.js';

export function getConnectionParentId(projectId: string, folderId?: string): string {
  if (!folderId) {
    return getProjectNodeId(projectId);
  }

  return getConnectionFolderId({ projectId, folderId });
}
