/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IConnectionFolderParam } from '../ConnectionFolderResource';
import { createConnectionFolderParam } from '../createConnectionFolderParam';

export function getConnectionFolderIdFromNodeId(nodeId: string): IConnectionFolderParam | undefined {
  const data = /^folder:\/\/(.*?)\/(.*)$/gi.exec(nodeId);

  if (data) {
    const [t, projectId, folderId] = data;
    return createConnectionFolderParam(projectId, folderId);
  }

  return undefined;
}
