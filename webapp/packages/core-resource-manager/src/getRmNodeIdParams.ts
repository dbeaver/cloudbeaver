/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { testPath } from '@cloudbeaver/core-utils';

import { NODE_PATH_TEMPLATE_RM_PROJECT } from './NODE_PATH_TEMPLATE_RM_PROJECT';
import { NODE_PATH_TEMPLATE_RM_PROJECT_RESOURCE } from './NODE_PATH_TEMPLATE_RM_PROJECT_RESOURCE';

interface IRmNodeIdParams {
  projectId: string;
  resourcePath?: string;
}

export function getRmNodeIdParams(nodeId: string): IRmNodeIdParams | null {
  return (
    testPath(NODE_PATH_TEMPLATE_RM_PROJECT_RESOURCE, nodeId)
    ?? testPath(NODE_PATH_TEMPLATE_RM_PROJECT, nodeId, true)
  );
}