/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { CachedMapResource, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  type SqlGenerateResultSetQueryQueryVariables,
  type SqlQueryGenerator,
  type SqlQueryGeneratorOptions,
} from '@cloudbeaver/core-sdk';
import { AutoRunningTask, type ITask } from '@cloudbeaver/core-executor';
import { isArraysEqual } from '@cloudbeaver/core-utils';

export interface ISqlGeneratorsKey {
  nodeIds: string[];
}

export const MAX_GENERATORS_LENGTH = 15;
export const getDefaultQueryGeneratorOptions = (): SqlQueryGeneratorOptions => ({
  useFullyQualifiedNames: true,
  compactSql: false,
  showFullDdl: false,
});
export const DDL_GENERATOR_ID = 'tableDDL';

@injectable(() => [GraphQLService, AsyncTaskInfoService, NavNodeInfoResource])
export class SqlGeneratorsResource extends CachedMapResource<ISqlGeneratorsKey, SqlQueryGenerator[]> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();

    const mapKeys = (key: ResourceKey<string>) => {
      const nodeIds = new Set(ResourceKeyUtils.toArray(navNodeInfoResource.aliases.transformToKey(key)));
      return resourceKeyList(this.keys.filter(selection => selection.nodeIds.some(id => nodeIds.has(id))));
    };
    navNodeInfoResource.outdateResource(this, mapKeys);
    navNodeInfoResource.deleteInResource(this, mapKeys);
  }

  generateEntityQuery(generatorId: string, nodePathList: string | string[], options?: SqlQueryGeneratorOptions): ITask<string> {
    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlGenerateEntityQuery({
        generatorId,
        nodePathList,
        generatorOptions: options,
      });

      return taskInfo;
    });

    const operation = new AutoRunningTask<string>(
      async () => {
        try {
          const info = await this.asyncTaskInfoService.run(task);
          return info.taskResult;
        } finally {
          if (!task.pending) {
            await this.asyncTaskInfoService.remove(task.id);
          }
        }
      },
      async () => {
        try {
          if (task.pending && !task.cancelled) {
            await this.asyncTaskInfoService.cancel(task.id);
          }
        } catch (exception) {
          // Task.cancel marks itself cancelled before calling the server; allow a retry on failure.
          operation.cancelled = false;
          throw exception;
        }
      },
    );
    return operation;
  }

  async generateResultSetSql(params: SqlGenerateResultSetQueryQueryVariables): Promise<string | null> {
    const response = await this.graphQLService.sdk.sqlGenerateResultSetQuery(params);

    return response.sqlGenerateResultSetQuery;
  }

  override isKeyEqual(first: ISqlGeneratorsKey, second: ISqlGeneratorsKey): boolean {
    return isArraysEqual(first.nodeIds, second.nodeIds);
  }

  protected async loader(key: ResourceKey<ISqlGeneratorsKey>): Promise<Map<ISqlGeneratorsKey, SqlQueryGenerator[]>> {
    await ResourceKeyUtils.forEachAsync(this.aliases.transformToKey(key), async selection => {
      const { generators } = await this.graphQLService.sdk.sqlEntityQueryGenerators({
        nodePathList: [...selection.nodeIds],
      });
      this.set(selection, generators);
    });
    return this.data;
  }

  protected validateKey(key: ISqlGeneratorsKey): boolean {
    return Array.isArray(key.nodeIds) && key.nodeIds.length > 0 && key.nodeIds.every(id => typeof id === 'string');
  }
}
