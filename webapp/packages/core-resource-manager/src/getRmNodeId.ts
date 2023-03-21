/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { buildTemplatePath } from '@cloudbeaver/core-utils';

import { NODE_PATH_TEMPLATE_RM_PROJECT } from './NODE_PATH_TEMPLATE_RM_PROJECT';
import { NODE_PATH_TEMPLATE_RM_PROJECT_RESOURCE } from './NODE_PATH_TEMPLATE_RM_PROJECT_RESOURCE';

export function getRmNodeId(projectId: string, resourcePath?: string): string {
  if (resourcePath === undefined) {
    return buildTemplatePath(NODE_PATH_TEMPLATE_RM_PROJECT, { projectId });
  }
  return buildTemplatePath(NODE_PATH_TEMPLATE_RM_PROJECT_RESOURCE, { projectId, resourcePath });
}