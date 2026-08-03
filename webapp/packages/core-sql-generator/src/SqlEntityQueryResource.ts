/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService, type SqlQueryGeneratorOptions } from '@cloudbeaver/core-sdk';

export interface ISqlEntityQueryKey {
  readonly nodeId: string;
  readonly generatorId: string;
  readonly options: SqlQueryGeneratorOptions;
}

@injectable(() => [GraphQLService, AsyncTaskInfoService, NavNodeInfoResource])
export class SqlEntityQueryResource extends CachedMapResource<ISqlEntityQueryKey, string> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();

    this.navNodeInfoResource.outdateResource(this, nodeId =>
      resourceKeyList(this.keys.filter(key => ResourceKeyUtils.isIntersect(nodeId, key.nodeId))),
    );
    this.navNodeInfoResource.deleteInResource(this, nodeId =>
      resourceKeyList(this.keys.filter(key => ResourceKeyUtils.isIntersect(nodeId, key.nodeId))),
    );
  }

  protected async loader(key: ResourceKey<ISqlEntityQueryKey>): Promise<Map<ISqlEntityQueryKey, string>> {
    if (isResourceAlias(key)) {
      throw new Error('Aliases not supported by this resource.');
    }

    const keys: ISqlEntityQueryKey[] = [];
    const values: string[] = [];

    await ResourceKeyUtils.forEachAsync(key, async entityQueryKey => {
      const query = await this.generateEntityQuery(entityQueryKey.generatorId, entityQueryKey.nodeId, entityQueryKey.options);
      keys.push(entityQueryKey);
      values.push(query);
    });

    this.set(resourceKeyList(keys), values);

    return this.data;
  }

  private async generateEntityQuery(generatorId: string, nodeId: string, options?: SqlQueryGeneratorOptions): Promise<string> {
    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlGenerateEntityQuery({
        generatorId,
        nodePathList: nodeId,
        generatorOptions: options,
      });

      return taskInfo;
    });

    const info = await this.asyncTaskInfoService.run(task);
    await this.asyncTaskInfoService.remove(task.id);

    return info.taskResult;
  }

  override isKeyEqual(param: ISqlEntityQueryKey, second: ISqlEntityQueryKey): boolean {
    return (
      param.nodeId === second.nodeId &&
      param.generatorId === second.generatorId &&
      param.options.useFullyQualifiedNames === second.options.useFullyQualifiedNames &&
      param.options.compactSql === second.options.compactSql &&
      param.options.showFullDdl === second.options.showFullDdl
    );
  }

  protected validateKey(key: ISqlEntityQueryKey): boolean {
    return (
      typeof key === 'object' &&
      key !== null &&
      typeof key.nodeId === 'string' &&
      typeof key.generatorId === 'string' &&
      typeof key.options === 'object'
    );
  }
}
