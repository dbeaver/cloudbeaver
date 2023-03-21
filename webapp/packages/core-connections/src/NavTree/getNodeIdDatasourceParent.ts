/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */


import { getNodeIdResourceProject } from '@cloudbeaver/core-projects';

import { getNodeIdDatasourceFolder } from './getNodeIdDatasourceFolder';

export function getNodeIdDatasourceParent(projectId: string, folderId?: string): string {
  if (!folderId) {
    return getNodeIdResourceProject(projectId);
  }

  return getNodeIdDatasourceFolder({ projectId, folderId });

}