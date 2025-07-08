/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, runInAction } from 'mobx';

import { AppAuthService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import {
  CachedMapAllKey,
  CachedMapResource,
  isResourceAlias,
  type ResourceKey,
  resourceKeyAliasFactory,
  resourceKeyList,
  type ResourceKeySimple,
  ResourceKeyUtils,
} from '@cloudbeaver/core-resource';
import { GraphQLService, type SqlContextInfo } from '@cloudbeaver/core-sdk';
import { flat } from '@cloudbeaver/core-utils';

import type { IConnectionInfoParams } from '../CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionInfoActiveProjectKey, ConnectionInfoResource } from '../ConnectionInfoResource.js';

export const ConnectionExecutionContextProjectKey = resourceKeyAliasFactory('@connection-folder/project', (projectId: string) => ({ projectId }));

export const NOT_INITIALIZED_CONTEXT_ID = '-1';
export type IConnectionExecutionContextInfo = SqlContextInfo & {
  defaultCatalog?: string | null;
  defaultSchema?: string | null;
};

@injectable()
export class ConnectionExecutionContextResource extends CachedMapResource<string, IConnectionExecutionContextInfo> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    userInfoResource: UserInfoResource,
    appAuthService: AppAuthService,
  ) {
    super();
    this.sync(
      connectionInfoResource,
      () => ConnectionInfoActiveProjectKey,
      () => CachedMapAllKey,
    );

    this.aliases.add(ConnectionExecutionContextProjectKey, param =>
      resourceKeyList(
        Array.from(this.data.entries())
          .filter(([, context]) => context.projectId === param.options.projectId)
          .map(([key]) => key),
      ),
    );

    appAuthService.requireAuthentication(this);

    userInfoResource.onUserChange.addHandler(() => {
      this.clear();
    });
    connectionInfoResource.onItemUpdate.addHandler(this.updateConnectionContexts.bind(this));
    connectionInfoResource.onItemDelete.addHandler(this.deleteConnectionContexts.bind(this));

    makeObservable<this, 'updateConnectionContexts' | 'deleteConnectionContexts'>(this, {
      updateConnectionContexts: action,
      deleteConnectionContexts: action,
    });
  }

  async create(key: IConnectionInfoParams, defaultCatalog?: string, defaultSchema?: string): Promise<IConnectionExecutionContextInfo> {
    const contextKey = getContextBaseId(key, '');
    return await this.performUpdate(contextKey, [], async () => {
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

      const result = this.get(baseContext.id)!;
      this.onDataOutdated.execute(contextKey);

      return result;
    });
  }

  async update(contextId: string, defaultCatalog?: string, defaultSchema?: string): Promise<IConnectionExecutionContextInfo> {
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

      this.set(contextId, {
        ...context,
        defaultCatalog,
        defaultSchema,
      });
      this.onDataOutdated.execute(contextId);
    });

    this.markOutdated();
    return this.get(contextId)!;
  }

  async destroy(contextId: string): Promise<void> {
    await this.performUpdate(contextId, [], async () => {
      const context = this.get(contextId);

      if (!context) {
        return;
      }

      await this.graphQLService.sdk.executionContextDestroy({
        contextId: context.id,
        connectionId: context.connectionId,
        projectId: context.projectId,
      });
      this.delete(contextId);
    });

    runInAction(() => {
      this.markOutdated(); // TODO: should be removed, currently multiple contexts for same connection may change catalog/schema for all contexts of connection
    });
  }

  protected async loader(originalKey: ResourceKey<string>): Promise<Map<string, IConnectionExecutionContextInfo>> {
    const contextsList: IConnectionExecutionContextInfo[] = [];
    let projectId: string | undefined;
    const all = this.aliases.isAlias(originalKey, CachedMapAllKey);
    const projectKey = this.aliases.isAlias(originalKey, ConnectionExecutionContextProjectKey);

    if (projectKey) {
      projectId = projectKey.options.projectId;
    }

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
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
        flat(
          ResourceKeyUtils.map(key, key =>
            this.values.filter(
              context =>
                context.connectionId === key.connectionId && context.projectId === key.projectId && !this.connectionInfoResource.isConnected(key),
            ),
          ),
        ).map(context => context.id),
      ),
    );
  }

  private deleteConnectionContexts(key: ResourceKeySimple<IConnectionInfoParams>): void {
    this.delete(
      resourceKeyList(
        flat(
          ResourceKeyUtils.map(key, key =>
            this.values.filter(context => context.connectionId === key.connectionId && context.projectId === key.projectId),
          ),
        ).map(context => context.id),
      ),
    );
  }

  protected override dataSet(key: string, value: IConnectionExecutionContextInfo): void {
    const oldContext = this.dataGet(key);
    super.dataSet(key, { ...oldContext, ...value });
  }

  protected validateKey(key: string): boolean {
    return typeof key === 'string';
  }
}

function getBaseContext(context: IConnectionExecutionContextInfo): IConnectionExecutionContextInfo {
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
