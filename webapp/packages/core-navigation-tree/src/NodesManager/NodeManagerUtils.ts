/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createPath } from '@cloudbeaver/core-utils';

import type { NavNode } from './EntityTypes.js';
import { isNotNullDefined } from '@dbeaver/js-helpers';

export const NODE_PATH_PREFIX = 'node://';
export const NODE_DATASOURCES_SEGMENT = 'datasources';

export const NodeManagerUtils = {
  connectionIdToConnectionNodeId(projectId: string, connectionId: string): string {
    return `${NODE_PATH_PREFIX}${createPath(projectId, NODE_DATASOURCES_SEGMENT, connectionId)}`;
  },

  concatSchemaAndCatalog(catalogId?: string, schemaId?: string): string {
    return `${schemaId || ''}${schemaId && catalogId ? '@' : ''}${catalogId || ''}`;
  },

  isDatabaseObject(node: NavNode | undefined): boolean {
    return isNotNullDefined(node?.objectId);
  },
  getPlainPath(nodeId: string): string {
    return nodeId.startsWith(NODE_PATH_PREFIX) ? nodeId.slice(NODE_PATH_PREFIX.length) : nodeId;
  },
};
