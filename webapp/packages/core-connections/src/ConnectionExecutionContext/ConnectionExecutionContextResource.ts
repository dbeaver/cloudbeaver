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
import {
  GraphQLService,
  CachedMapResource,
  resourceKeyList,
  ResourceKey,
  ResourceKeyUtils,
  ResourceKeyList,
  SqlContextInfo,
  CachedMapAllKey,
  isResourceKeyList,
} from '@cloudbeaver/core-sdk';
import { flat } from '@cloudbeaver/core-utils';

import { ConnectionInfoResource } from '../ConnectionInfoResource';
import type { IConnectionInfoParams } from '../IConnectionsResource';
import type { IConnectionExecutionContextInfo } from './IConnectionExecutionContextInfo';

const connectionExecutionContextProjectKeySymbol = Symbol('@connection-folder/project') as unknown as string;
export const ConnectionExecutionContextProjectKey = (projectId: string) => resourceKeyList<string>(
  [connectionExecutionContextProjectKeySymbol],
  projectId
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

    this.addAlias(
      isConnectionExecutionContextProjectKey,
      param => resourceKeyList(
        Array.from(this.data.entries())
          .filter(([key, context]) => context.projectId === param.mark)
          .map(([key]) => key)
      ),
      (a, b) => a.mark === b.mark
    );

    appAuthService.requireAuthentication(this);

    connectionInfoResource.onItemAdd.addHandler(this.updateConnectionContexts.bind(this));
    connectionInfoResource.onItemDelete.addHandler(this.deleteConnectionContexts.bind(this));

    makeObservable<this, 'updateContexts' | 'updateConnectionContexts' | 'deleteConnectionContexts'>(this, {
      updateContexts: action,
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
        this.updateContexts(baseContext);
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
    originalKey: ResourceKey<string>
  ): Promise<Map<string, IConnectionExecutionContextInfo>> {
    let projectId: string | undefined;
    const all = this.isAliasEqual(originalKey, CachedMapAllKey);
    const isProjectFolders = isConnectionExecutionContextProjectKey(originalKey);
    originalKey = this.transformParam(originalKey);

    if (isProjectFolders) {
      projectId = (originalKey as ResourceKeyList<string>).mark;
    }

    await ResourceKeyUtils.forEachAsync(
      (all || isProjectFolders) ? CachedMapAllKey : originalKey,
      async contextId => {
        let connectionId: string | undefined;

        const context = this.get(contextId);

        if (context && !all) {
          projectId = context.projectId;
          connectionId = context.connectionId;
        }

        const { contexts } = await this.graphQLService.sdk.executionContextList({
          projectId,
          connectionId,
          contextId: all ? undefined : (context?.id ?? contextId),
        });

        runInAction(() => {
          const key = this.updateContexts(...contexts.map(getBaseContext));

          if (all) {
            this.delete(
              resourceKeyList(
                this.keys.filter(contextId => !this.includes(key, contextId))
              )
            );
          }
        });
      }
    );

    return this.data;
  }

  private updateConnectionContexts(key: ResourceKey<IConnectionInfoParams>): void {
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

  private deleteConnectionContexts(key: ResourceKey<IConnectionInfoParams>): void {
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

  private updateContexts(...contexts: IConnectionExecutionContextInfo[]): ResourceKeyList<string> {
    const key = resourceKeyList(contexts.map(context => context.id));

    const oldContexts = this.get(key);
    this.set(key, oldContexts.map((context, i) => ({ ...context, ...contexts[i] })));

    return key;
  }

  protected validateParam(param: ResourceKey<string>): boolean {
    return (
      super.validateParam(param)
      || typeof param === 'string'
    );
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

function isConnectionExecutionContextProjectKey(
  param: ResourceKey<string>
): param is ResourceKeyList<string> {
  return isResourceKeyList(param) && param.list.includes(connectionExecutionContextProjectKeySymbol);
}

export function getRealExecutionContextId(id: string | undefined | null): string | null {
  if (id === NOT_INITIALIZED_CONTEXT_ID) {
    return null;
  }

  return id ?? null;
}
