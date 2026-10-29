/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { EObjectFeature, type INodeContainerInfo, type NavNode } from '@cloudbeaver/core-navigation-tree';
import type { SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';
import type { Connection } from '@cloudbeaver/core-connections';

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

interface IGeneratedSqlNode {
  connection: Pick<Connection, 'id' | 'projectId' | 'name'> | undefined;
  container: INodeContainerInfo;
  objectFeatures: NavNode['objectFeatures'];
}

interface IGeneratedSqlContext {
  connection: IGeneratedSqlNode['connection'];
  catalogId: string | undefined;
  schemaId: string | undefined;
  hasFullDdl: boolean;
}

export function getGeneratedSqlContext(generatorId: string, nodes: readonly IGeneratedSqlNode[]): IGeneratedSqlContext {
  const nodeConnections = nodes.map(node => node.connection);
  const connection = haveSameSqlGenerationConnection(nodeConnections) ? nodeConnections[0] : undefined;
  const containers = nodes.map(node => node.container);
  const first = containers[0];
  const catalogId = connection && first && containers.every(info => info.catalogId === first.catalogId) ? first.catalogId : undefined;
  const schemaId =
    connection && first && containers.every(info => info.catalogId === first.catalogId && info.schemaId === first.schemaId)
      ? first.schemaId
      : undefined;
  const hasFullDdl =
    generatorId.toLowerCase().includes(DDL_GENERATOR_ID.toLowerCase()) &&
    nodes.some(node => node.objectFeatures.includes(EObjectFeature.supportsFullDdl));

  return { connection, catalogId, schemaId, hasFullDdl };
}
