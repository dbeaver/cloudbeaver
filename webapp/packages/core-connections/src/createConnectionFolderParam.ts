/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ConnectionFolder, IConnectionFolderParam } from './ConnectionFolderResource.js';

export function createConnectionFolderParam(projectId: string, folder: ConnectionFolder): IConnectionFolderParam;
export function createConnectionFolderParam(projectId: string, folderId: string): IConnectionFolderParam;
export function createConnectionFolderParam(projectId: string, folderIdOrFolder: string | ConnectionFolder): IConnectionFolderParam {
  if (typeof folderIdOrFolder === 'object') {
    folderIdOrFolder = folderIdOrFolder.id;
  }

  return {
    projectId: projectId,
    folderId: folderIdOrFolder,
  };
}
