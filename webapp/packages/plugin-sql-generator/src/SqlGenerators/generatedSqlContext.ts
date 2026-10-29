/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { EObjectFeature, type NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import type { SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';
import type { ConnectionInfoResource } from '@cloudbeaver/core-connections';

import { DDL_GENERATOR_ID } from './SqlGeneratorsResource.js';
import { haveSameSqlGenerationConnection } from './sqlGenerationSelection.js';

export type GeneratedSqlPayload = {
  nodeName?: string;
  generatorId: string;
  generatorName?: string;
  options?: SqlQueryGeneratorOptions;
} & (
  { nodeIds: readonly [string, ...string[]] } | { nodeId: string; query: string; regenerateQuery(options: SqlQueryGeneratorOptions): Promise<string> }
);

interface IGeneratedSqlContext {
  nodeIds: readonly [string, ...string[]];
  primaryNodeId: string;
  connection: ReturnType<ConnectionInfoResource['getConnectionForNode']>;
  catalogId: string | undefined;
  schemaId: string | undefined;
  hasFullDdl: boolean;
}

export function getGeneratedSqlContext(
  payload: GeneratedSqlPayload,
  nodes: NavNodeManagerService,
  connections: ConnectionInfoResource,
): IGeneratedSqlContext {
  const nodeIds: readonly [string, ...string[]] = 'nodeIds' in payload ? payload.nodeIds : [payload.nodeId];
  const primaryNodeId = nodeIds[0];
  const nodeConnections = nodeIds.map(id => connections.getConnectionForNode(id));
  const connection = haveSameSqlGenerationConnection(nodeConnections) ? nodeConnections[0] : undefined;
  const containers = nodeIds.map(id => nodes.getNodeContainerInfo(id));
  const first = containers[0]!;
  const catalogId = connection && containers.every(info => info.catalogId === first.catalogId) ? first.catalogId : undefined;
  const schemaId =
    connection && containers.every(info => info.catalogId === first.catalogId && info.schemaId === first.schemaId) ? first.schemaId : undefined;
  const hasFullDdl =
    payload.generatorId.toLowerCase().includes(DDL_GENERATOR_ID.toLowerCase()) &&
    nodeIds.some(id => nodes.getNode(id)?.objectFeatures.includes(EObjectFeature.supportsFullDdl));

  return { nodeIds, primaryNodeId, connection, catalogId, schemaId, hasFullDdl };
}
