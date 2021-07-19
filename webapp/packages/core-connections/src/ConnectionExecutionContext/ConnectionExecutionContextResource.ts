/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { SessionDataResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  resourceKeyList,
  ResourceKey,
  ResourceKeyUtils,
  ResourceKeyList,
  SqlContextInfo,
} from '@cloudbeaver/core-sdk';
import { flat, MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionInfoResource } from '../ConnectionInfoResource';
import type { IConnectionExecutionContextInfo } from './IConnectionExecutionContextInfo';

@injectable()
export class ConnectionExecutionContextResource extends CachedMapResource<string, IConnectionExecutionContextInfo> {
  static keyAll = resourceKeyList(['all'], 'all');
  private loadedKeyMetadata: MetadataMap<string, boolean>;

  constructor(
    private graphQLService: GraphQLService,
    private connectionInfoResource: ConnectionInfoResource,
    sessionDataResource: SessionDataResource
  ) {
    super();
    this.loadedKeyMetadata = new MetadataMap(() => false);

    sessionDataResource.onDataOutdated.addHandler(() => this.markOutdated());
    sessionDataResource.onDataUpdate.addHandler(async () => {
      await this.load(ConnectionExecutionContextResource.keyAll);
    });
    connectionInfoResource.onItemAdd.addHandler(this.updateConnectionContexts.bind(this));
    connectionInfoResource.onItemDelete.addHandler(this.deleteConnectionContexts.bind(this));

    this.addAlias(ConnectionExecutionContextResource.keyAll, key => {
      if (this.keys.length > 0) {
        return resourceKeyList(this.keys, ConnectionExecutionContextResource.keyAll.mark);
      }
      return ConnectionExecutionContextResource.keyAll;
    });
  }

  has(id: string): boolean {
    if (this.loadedKeyMetadata.has(id)) {
      return this.loadedKeyMetadata.get(id);
    }

    return this.data.has(id);
  }

  updateConnectionContexts(key: ResourceKey<string>): void {
    this.delete(
      resourceKeyList(
        flat(ResourceKeyUtils.map(
          key,
          connectionId => this.values.filter(context => {
            const connection = this.connectionInfoResource.get(connectionId);
            return context.connectionId === connectionId && !connection?.connected;
          })
        )).map(context => context.baseId)
      )
    );
  }

  deleteConnectionContexts(key: ResourceKey<string>): void {
    this.delete(
      resourceKeyList(
        flat(ResourceKeyUtils.map(
          key,
          connectionId => this.values.filter(context => context.connectionId === connectionId)
        )).map(context => context.baseId)
      )
    );
  }

  async create(
    connectionId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<IConnectionExecutionContextInfo> {
    return await this.performUpdate('', [], async () => {
      const { context } = await this.graphQLService.sdk.executionContextCreate({
        connectionId,
        defaultCatalog,
        defaultSchema,
      });

      const baseContext = getBaseContext(context);

      this.updateContexts(baseContext);

      return this.get(baseContext.baseId)!;
    });
  }

  async update(
    contextId: string,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<IConnectionExecutionContextInfo> {
    const context = this.get(contextId);

    if (!context) {
      throw new Error('Execution context not found');
    }

    await this.performUpdate(contextId, [], async () => {
      await this.graphQLService.sdk.executionContextUpdate({
        contextId: context.id,
        connectionId: context.connectionId,
        defaultCatalog,
        defaultSchema,
      });

      context.defaultCatalog = defaultCatalog;
      context.defaultSchema = defaultSchema;
    });

    return context;
  }

  async destroy(contextId: string): Promise<void> {
    const context = this.get(contextId);

    if (!context) {
      return;
    }

    await this.performUpdate(contextId, [], async () => {
      await this.graphQLService.sdk.executionContextDestroy({
        contextId: context.id,
        connectionId: context.connectionId,
      });
    });

    this.delete(contextId);
  }

  async loadAll(): Promise<IConnectionExecutionContextInfo[]> {
    this.resetIncludes();
    await this.load(ConnectionExecutionContextResource.keyAll);

    return this.values;
  }

  async refreshAll(): Promise<IConnectionExecutionContextInfo[]> {
    this.resetIncludes();
    await this.refresh(ConnectionExecutionContextResource.keyAll);
    return this.values;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(ConnectionExecutionContextResource.keyAll);
    this.loadedKeyMetadata.set(ConnectionExecutionContextResource.keyAll.list[0], false);
  }

  protected async loader(
    key: ResourceKey<string>
  ): Promise<Map<string, IConnectionExecutionContextInfo>> {
    const all = ResourceKeyUtils.hasMark(key, ConnectionExecutionContextResource.keyAll.mark);

    await ResourceKeyUtils.forEachAsync(key, async contextId => {
      const context = this.get(contextId);
      const { contexts } = await this.graphQLService.sdk.executionContextList({
        contextId: all ? undefined : (context?.id ?? contextId),
        // connectionId
      });

      const key = this.updateContexts(...contexts.map(getBaseContext));

      for (const contextId of this.keys) {
        if (!ResourceKeyUtils.includes(key, contextId)) {
          this.delete(contextId);
        }
      }
    });

    if (all) {
      this.loadedKeyMetadata.set(ConnectionExecutionContextResource.keyAll.list[0], true);
    }
    return this.data;
  }

  private updateContexts(...contexts: IConnectionExecutionContextInfo[]): ResourceKeyList<string> {
    const key = resourceKeyList(contexts.map(context => context.baseId));

    const oldContexts = this.get(key);
    this.set(key, oldContexts.map((context, i) => ({ ...context, ...contexts[i] })));

    return key;
  }
}

function getBaseContext(context: SqlContextInfo): IConnectionExecutionContextInfo {
  return {
    ...context,
    baseId: `${context.connectionId}_${context.id}`,
  };
}
