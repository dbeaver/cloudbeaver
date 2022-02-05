/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { EPermission, PermissionsResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedMapResource,
  resourceKeyList,
  ResourceKey,
  ResourceKeyUtils,
  ResourceKeyList,
  SqlContextInfo,
  CachedMapAllKey,
} from '@cloudbeaver/core-sdk';
import { flat } from '@cloudbeaver/core-utils';

import { ConnectionInfoResource } from '../ConnectionInfoResource';
import type { IConnectionExecutionContextInfo } from './IConnectionExecutionContextInfo';

@injectable()
export class ConnectionExecutionContextResource extends CachedMapResource<string, IConnectionExecutionContextInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    permissionsResource: PermissionsResource
  ) {
    super();

    permissionsResource
      .require(this, EPermission.public)
      .outdateResource(this);

    connectionInfoResource.onItemAdd.addHandler(this.updateConnectionContexts.bind(this));
    connectionInfoResource.onItemDelete.addHandler(this.deleteConnectionContexts.bind(this));

    makeObservable<this, 'updateContexts' | 'updateConnectionContexts' | 'deleteConnectionContexts'>(this, {
      updateContexts: action,
      updateConnectionContexts: action,
      deleteConnectionContexts: action,
    });
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

      this.markOutdated(); // TODO: should be removed, currently multiple contexts for same connection may change catalog/schema for all contexts of connection
      return this.get(baseContext.id)!;
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

    this.markOutdated();
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

    this.markOutdated(); // TODO: should be removed, currently multiple contexts for same connection may change catalog/schema for all contexts of connection
    this.delete(contextId);
  }

  async loadAll(): Promise<IConnectionExecutionContextInfo[]> {
    await this.load(CachedMapAllKey);

    return this.values;
  }

  async refreshAll(): Promise<IConnectionExecutionContextInfo[]> {
    this.resetIncludes();
    await this.refresh(CachedMapAllKey);
    return this.values;
  }

  refreshAllLazy(): void {
    this.resetIncludes();
    this.markOutdated(CachedMapAllKey);
  }

  protected async loader(
    key: ResourceKey<string>
  ): Promise<Map<string, IConnectionExecutionContextInfo>> {
    const all = ResourceKeyUtils.includes(key, CachedMapAllKey);
    key = this.transformParam(key);

    await ResourceKeyUtils.forEachAsync(all ? CachedMapAllKey : key, async contextId => {
      const context = this.get(contextId);
      const { contexts } = await this.graphQLService.sdk.executionContextList({
        contextId: all ? undefined : (context?.id ?? contextId),
        // connectionId
      });

      const key = this.updateContexts(...contexts.map(getBaseContext));

      if (all) {
        for (const contextId of this.keys) {
          if (!ResourceKeyUtils.includes(key, contextId)) {
            this.delete(contextId);
          }
        }
      }
    });

    return this.data;
  }

  private updateConnectionContexts(key: ResourceKey<string>): void {
    this.delete(
      resourceKeyList(
        flat(ResourceKeyUtils.map(
          key,
          connectionId => this.values.filter(context => {
            const connection = this.connectionInfoResource.get(connectionId);
            return context.connectionId === connectionId && !connection?.connected;
          })
        )).map(context => context.id)
      )
    );
  }

  private deleteConnectionContexts(key: ResourceKey<string>): void {
    this.delete(
      resourceKeyList(
        flat(ResourceKeyUtils.map(
          key,
          connectionId => this.values.filter(context => context.connectionId === connectionId)
        )).map(context => context.id)
      )
    );
  }

  private updateContexts(...contexts: IConnectionExecutionContextInfo[]): ResourceKeyList<string> {
    const key = resourceKeyList(contexts.map(context => context.id));

    const oldContexts = this.get(key);
    this.set(key, oldContexts.map((context, i) => ({ ...context, ...contexts[i] })));

    return key;
  }
}

function getBaseContext(context: SqlContextInfo): IConnectionExecutionContextInfo {
  return {
    ...context,
  };
}


/**
 * @deprecated contextId is unique, function don't needed anymore
 */
export function getContextBaseId(connectionId: string, contextId: string): string {
  return `${connectionId}_${contextId}`;
}
