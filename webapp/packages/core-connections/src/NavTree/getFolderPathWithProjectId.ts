/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isFolderNodeId } from './isFolderNodeId.js';

export function getFolderPathWithProjectId(folderId: string): string {
  if (!isFolderNodeId(folderId)) {
    throw new Error('Invalid folder id');
  }

  return folderId.replace('folder://', '');
}
