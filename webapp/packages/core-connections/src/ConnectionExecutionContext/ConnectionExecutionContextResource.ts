/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, runInAction } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService, CachedMapResource, resourceKeyList, ResourceKey, ResourceKeyUtils, SqlContextInfo, CachedMapAllKey, resourceKeyAliasFactory, ResourceKeySimple, isResourceAlias } from '@cloudbeaver/core-sdk';
import { flat } from '@cloudbeaver/core-utils';

import { ConnectionInfoActiveProjectKey, ConnectionInfoResource } from '../ConnectionInfoResource';
import type { IConnectionInfoParams } from '../IConnectionsResource';
import type { IConnectionExecutionContextInfo } from './IConnectionExecutionContextInfo';

export const ConnectionExecutionContextProjectKey = resourceKeyAliasFactory(
  '@connection-folder/project',
  (projectId: string) => ({ projectId })
);

export const NOT_INITIALIZED_CONTEXT_ID = '-1';

@injectable()
export class ConnectionExecutionContextResource extends CachedMapResource<string, IConnectionExecutionContextInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    appAuthService: AppAuthService,
  ) {
    super();
    this.sync(connectionInfoResource, () => ConnectionInfoActiveProjectKey, () => CachedMapAllKey);

    this.addAlias(
      ConnectionExecutionContextProjectKey,
      param => resourceKeyList(
        Array.from(this.data.entries())
          .filter(([key, context]) => context.projectId === param.options.projectId)
          .map(([key]) => key)
      )
    );

    appAuthService.requireAuthentication(this);

    connectionInfoResource.onItemUpdate.addHandler(this.updateConnectionContexts.bind(this));
    connectionInfoResource.onItemDelete.addHandler(this.deleteConnectionContexts.bind(this));

    makeObservable<this, 'updateConnectionContexts' | 'deleteConnectionContexts'>(this, {
      updateConnectionContexts: action,
      deleteConnectionContexts: action,
    });
  }

  async create(
    key: IConnectionInfoParams,
    defaultCatalog?: string,
    defaultSchema?: string
  ): Promise<IConnectionExecutionContextInfo> {
    return await this.performUpdate(getContextBaseId(key, ''), [], async () => {
      const { context } = await this.graphQLService.sdk.executionContextCreate({
        ...key,
        defaultCatalog,
        defaultSchema,
      });

      const baseContext = getBaseContext(context);

      runInAction(() => {
        this.set(baseContext.id, baseContext);
        this.markOutdated(); // TODO: should be removed, currently multiple contexts for same connection may change catalog/schema for all contexts of connection
      });

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
        projectId: context.projectId,
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
        projectId: context.projectId,
      });
    });

    this.markOutdated(); // TODO: should be removed, currently multiple contexts for same connection may change catalog/schema for all contexts of connection
    this.delete(contextId);
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
    originalKey: ResourceKey<string>
  ): Promise<Map<string, IConnectionExecutionContextInfo>> {
    const contextsList: IConnectionExecutionContextInfo[] = [];
    let projectId: string | undefined;
    const all = this.isAlias(originalKey, CachedMapAllKey);

    if (this.isAlias(originalKey, ConnectionExecutionContextProjectKey)) {
      projectId = originalKey.options.projectId;
    }

    await ResourceKeyUtils.forEachAsync(
      originalKey,
      async key => {
        let contextId: string | undefined;
        let connectionId: string | undefined;

        if (!isResourceAlias(key)) {
          const context = this.get(key);
          contextId = key;
          projectId = context?.projectId;
          connectionId = context?.connectionId;
        }

        const { contexts } = await this.graphQLService.sdk.executionContextList({
          projectId,
          connectionId,
          contextId,
        });

        contextsList.push(...contexts);
      });

    runInAction(() => {
      const key = resourceKeyList(contextsList.map(context => context.id));
      if (all) {
        this.replace(key, contextsList.map(getBaseContext));
      } else {
        this.set(key, contextsList.map(getBaseContext));
      }
    });

    return this.data;
  }

  private updateConnectionContexts(key: ResourceKeySimple<IConnectionInfoParams>): void {
    this.delete(
      resourceKeyList(
        flat(ResourceKeyUtils.map(
          key,
          key => this.values.filter(context => {
            const connection = this.connectionInfoResource.get(key);
            return (
              context.connectionId === key.connectionId
              && context.projectId === key.projectId
              && !connection?.connected
            );
          })
        )).map(context => context.id)
      )
    );
  }

  private deleteConnectionContexts(key: ResourceKeySimple<IConnectionInfoParams>): void {
    this.delete(
      resourceKeyList(
        flat(ResourceKeyUtils.map(
          key,
          key => this.values.filter(context => (
            context.connectionId === key.connectionId
            && context.projectId === key.projectId
          ))
        )).map(context => context.id)
      )
    );
  }

  protected dataSet(key: string, value: IConnectionExecutionContextInfo): void {
    const oldContext = this.dataGet(key);
    super.dataSet(key, { ...oldContext, ...value });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
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
export function getContextBaseId(key: IConnectionInfoParams, contextId: string): string {
  return `${key.connectionId}:${contextId}`;
}

export function getRealExecutionContextId(id: string | undefined | null): string | null {
  if (id === NOT_INITIALIZED_CONTEXT_ID) {
    return null;
  }

  return id ?? null;
}
