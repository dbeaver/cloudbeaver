/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';

import type { SqlGeneratorsResource } from './SqlGeneratorsResource.js';
import type { IGeneratedSqlSource } from './useGeneratedSql.js';

interface IGeneratedSqlPayload {
  nodeName?: string;
  generatorId: string;
  generatorName?: string;
  options?: SqlQueryGeneratorOptions;
}

export interface IGeneratedSqlSelectionPayload extends IGeneratedSqlPayload {
  nodeIds: readonly [string, ...string[]];
}

export interface IGeneratedSqlQueryPayload extends IGeneratedSqlPayload {
  nodeId: string;
  query: string;
  regenerateQuery(options: SqlQueryGeneratorOptions): Promise<string>;
}

export type GeneratedSqlPayload = IGeneratedSqlSelectionPayload | IGeneratedSqlQueryPayload;

interface IGeneratedSqlDialogSource extends IGeneratedSqlSource {
  nodeIds: readonly [string, ...string[]];
}

export function isGeneratedSqlQueryPayload(payload: GeneratedSqlPayload): payload is IGeneratedSqlQueryPayload {
  return 'regenerateQuery' in payload;
}

export function getGeneratedSqlSource(payload: GeneratedSqlPayload, resource: SqlGeneratorsResource): IGeneratedSqlDialogSource {
  if (isGeneratedSqlQueryPayload(payload)) {
    return {
      nodeIds: [payload.nodeId],
      query: payload.query,
      options: payload.options,
      generate: payload.regenerateQuery,
    };
  }

  return {
    nodeIds: payload.nodeIds,
    options: payload.options,
    generate: options => resource.generateEntityQuery(payload.generatorId, [...payload.nodeIds], options),
  };
}
