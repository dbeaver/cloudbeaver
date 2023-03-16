/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { GraphQLService, NavNodeInfoFragment, ICachedResourceMetadata, ResourceKeyUtils, CachedMapResource, ResourceKey, resourceKeyList, isResourceAlias } from '@cloudbeaver/core-sdk';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionInfoActiveProjectKey, ConnectionInfoResource } from './ConnectionInfoResource';
import type { IConnectionInfoParams } from './IConnectionsResource';

export type ObjectContainer = NavNodeInfoFragment;
export interface ICatalogData {
  catalog: ObjectContainer;
  schemaList: ObjectContainer[];
}

export interface IStructContainers {
  catalogList: ICatalogData[];
  schemaList: ObjectContainer[];
  supportsCatalogChange: boolean;
  supportsSchemaChange: boolean;
  activeCatalog: string | undefined;
}

interface ObjectContainerParams {
  projectId: string;
  connectionId: string;
  catalogId?: string;
}

interface ObjectContainerMetadata extends ICachedResourceMetadata {
  outdatedData: (string | undefined)[];
  loadingData: (string | undefined)[];
}

@injectable()
export class ContainerResource extends CachedMapResource<
ObjectContainerParams,
IStructContainers,
Record<string, never>,
ObjectContainerMetadata
> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    appAuthService: AppAuthService,
  ) {
    super();

    appAuthService.requireAuthentication(this);
    this.preloadResource(connectionInfoResource, () => ConnectionInfoActiveProjectKey);
    this.before(ExecutorInterrupter.interrupter(key => !connectionInfoResource.isConnected(key)));

    this.connectionInfoResource.onItemDelete.addHandler(
      key => ResourceKeyUtils.forEach(
        key,
        key => this.delete({ projectId: key.projectId, connectionId: key.connectionId })
      )
    );
    this.connectionInfoResource.onItemUpdate.addHandler(
      key => ResourceKeyUtils.forEach(key, key => {
        if (!this.connectionInfoResource.get(key)?.connected) {
          this.delete({ projectId: key.projectId, connectionId: key.connectionId });
        }
      })
    );

    this.connectionInfoResource.onClear.addHandler(() => this.clear());
  }

  getSchema(
    connectionKey: IConnectionInfoParams,
    schemaId: string
  ): ObjectContainer | undefined {
    const connectionData = this.get(connectionKey);

    return connectionData?.schemaList.find(schema => schema.name === schemaId);
  }

  getCatalogData(
    connectionKey: IConnectionInfoParams,
    catalogId: string
  ): ICatalogData | undefined {
    const connectionData = this.get(connectionKey);

    return connectionData?.catalogList.find(catalog => catalog.catalog.name === catalogId);
  }

  protected async loader(
    originalKey: ResourceKey<ObjectContainerParams>
  ): Promise<Map<ObjectContainerParams, IStructContainers>> {
    if (isResourceAlias(originalKey)) {
      throw new Error('Aliases not supported by this resource');
    }
    const containers = new Map<ObjectContainerParams, IStructContainers>();

    await ResourceKeyUtils.forEachAsync(originalKey, async key => {
      const { projectId, connectionId, catalogId } = key;
      const { navGetStructContainers } = await this.graphQLService.sdk.navGetStructContainers({
        projectId,
        connectionId,
        catalogId,
        withDetails: false,
      });

      containers.set({ projectId, connectionId }, {
        catalogList: navGetStructContainers.catalogList,
        schemaList: navGetStructContainers.schemaList,
        supportsCatalogChange: navGetStructContainers.supportsCatalogChange,
        supportsSchemaChange: navGetStructContainers.supportsSchemaChange,
        activeCatalog: catalogId || undefined,
      });
    });

    this.set(resourceKeyList([...containers.keys()]), [...containers.values()]);

    return this.data;
  }

  isKeyEqual(param: ObjectContainerParams, second: ObjectContainerParams): boolean {
    return (
      param.projectId === second.projectId
      && param.connectionId === second.connectionId
      && param.catalogId === second.catalogId
    );
  }

  protected getDefaultMetadata(
    key: ObjectContainerParams,
    metadata: MetadataMap<ObjectContainerParams, ObjectContainerMetadata>
  ): ObjectContainerMetadata {
    return {
      ...super.getDefaultMetadata(key, metadata),
      outdatedData: observable([]),
      loadingData: observable([]),
    };
  }

  protected validateKey(key: ObjectContainerParams): boolean {
    return (
      typeof key === 'object'
      && typeof key.projectId === 'string'
      && ['string'].includes(typeof key.connectionId)
      && ['string', 'undefined'].includes(typeof key.catalogId)
    );
  }
}
