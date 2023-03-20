/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { buildTemplatePath } from '@cloudbeaver/core-utils';

import type { Connection } from '../ConnectionInfoResource';
import { NODE_PATH_TEMPLATE_RESOURCE_CONNECTION } from './NODE_PATH_TEMPLATE_RESOURCE_CONNECTION';
import { NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION } from './NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION';

export function getNodeIdDatasource(connection: Connection): string {
  if (connection.folder) {
    return buildTemplatePath(NODE_PATH_TEMPLATE_RESOURCE_CONNECTION_FOLDER_CONNECTION, {
      projectId: connection.projectId,
      connectionId: connection.id,
      folder: connection.folder,
    });
  }

  return buildTemplatePath(NODE_PATH_TEMPLATE_RESOURCE_CONNECTION, {
    projectId: connection.projectId,
    connectionId: connection.id,
  });
}