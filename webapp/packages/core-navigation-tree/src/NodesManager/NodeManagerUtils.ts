/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const CONNECTION_NODE_ID_PREFIX = 'database://';

export const NodeManagerUtils = {
  getConnectionId(nodeId: string) {
    const indexOfConnectionPart = nodeId.indexOf('/', CONNECTION_NODE_ID_PREFIX.length);
    const connectionId = nodeId.slice(CONNECTION_NODE_ID_PREFIX.length, indexOfConnectionPart > -1 ? indexOfConnectionPart : nodeId.length);

    return connectionId;
  },

  connectionIdToConnectionNodeId(connectionId: string): string {
    return `${CONNECTION_NODE_ID_PREFIX}${connectionId}`;
  },

  isDatabaseObject(nodeId: string): boolean {
    return nodeId.startsWith(CONNECTION_NODE_ID_PREFIX);
  },

  concatSchemaAndCatalog(catalogId?: string, schemaId?: string): string {
    return `${schemaId || ''}${schemaId && catalogId ? '@' : ''}${catalogId || ''}`;
  },
};
