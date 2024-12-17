/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getFolderPathWithProjectId } from './getFolderPathWithProjectId.js';

export function getFolderPath(folderId: string): string {
  return getFolderPathWithProjectId(folderId).split('/').slice(1).join('/');
}
