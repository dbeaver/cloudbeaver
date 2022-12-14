/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { EPermission, SessionPermissionsResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedDataResource,
  NavNodeInfoFragment, ICachedResourceMetadata, ResourceKeyUtils, CachedMapAllKey
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionInfoResource } from './ConnectionInfoResource';
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

type DataValue = Map<string, IStructContainers>;

const defaultCatalog = undefined;

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
export class ContainerResource extends CachedDataResource<
DataValue,
ObjectContainerParams,
string
> {
  metadata: MetadataMap<string, ObjectContainerMetadata>;

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    permissionsResource: SessionPermissionsResource,
  ) {
    super(new Map());

    this.metadata = new MetadataMap(() => ({
      outdated: true,
      loading: false,
      exception: null,
      outdatedData: observable([]),
      loadingData: observable([]),
      includes: observable([]),
      dependencies: observable([]),
    }));

    permissionsResource.require(this, EPermission.public);
    this.preloadResource(connectionInfoResource, () => CachedMapAllKey);
    this.before(ExecutorInterrupter.interrupter(key => !connectionInfoResource.isConnected(key)));

    this.connectionInfoResource.onItemDelete.addHandler(
      key => ResourceKeyUtils.forEach(
        key,
        key => this.data.delete(serializeKey({ projectId: key.projectId, connectionId: key.connectionId }))
      )
    );
    this.connectionInfoResource.onItemAdd.addHandler(
      key => ResourceKeyUtils.forEach(key, key => {
        if (!this.connectionInfoResource.get(key)?.connected) {
          this.data.delete(serializeKey({ projectId: key.projectId, connectionId: key.connectionId }));
        }
      })
    );
  }

  get(key: ObjectContainerParams): IStructContainers | undefined {
    return this.data.get(serializeKey(key));
  }

  getSchema(
    connectionKey: IConnectionInfoParams,
    schemaId: string
  ): ObjectContainer | undefined {
    const connectionData = this.data.get(serializeKey(connectionKey));

    return connectionData?.schemaList.find(schema => schema.name === schemaId);
  }

  getCatalogData(
    connectionKey: IConnectionInfoParams,
    catalogId: string
  ): ICatalogData | undefined {
    const connectionData = this.data.get(serializeKey(connectionKey));

    return connectionData?.catalogList.find(catalog => catalog.catalog.name === catalogId);
  }

  isLoaded({ projectId, connectionId, catalogId }: ObjectContainerParams): boolean {
    const container = this.data.get(serializeKey({ projectId, connectionId }));

    if (!container) {
      return false;
    }

    return container.activeCatalog === (catalogId ?? defaultCatalog);
  }

  isOutdated(param?: ObjectContainerParams): boolean {
    if (!param) {
      return super.isOutdated();
    }

    const metadata = this.metadata.get(serializeKey(param));
    const catalogId = param.catalogId ?? defaultCatalog;
    return metadata.outdatedData.includes(catalogId);
  }

  isDataLoading(param: ObjectContainerParams): boolean {
    const metadata = this.metadata.get(serializeKey(param));
    const catalogId = param.catalogId ?? defaultCatalog;
    return metadata.loadingData.includes(catalogId);
  }

  markDataLoading(param: ObjectContainerParams): void {
    const metadata = this.metadata.get(serializeKey(param));
    const catalogId = param.catalogId ?? defaultCatalog;

    if (!metadata.loadingData.includes(catalogId)) {
      metadata.loadingData.push(catalogId);
    }
  }

  markDataLoaded(param: ObjectContainerParams): void {
    const metadata = this.metadata.get(serializeKey(param));
    const catalogId = param.catalogId ?? defaultCatalog;
    metadata.loadingData = metadata.loadingData.filter(id => id !== catalogId);
  }

  markOutdated(param?: ObjectContainerParams): void {
    if (!param) {
      super.markOutdated();
      return;
    }

    const catalogId = param.catalogId ?? defaultCatalog;

    const metadata = this.metadata.get(serializeKey(param));
    if (!metadata.outdatedData.includes(catalogId)) {
      metadata.outdatedData.push(catalogId);
    }
    this.onDataOutdated.execute(param);
  }

  markUpdated(param: ObjectContainerParams): void {
    const metadata = this.metadata.get(serializeKey(param));
    const catalogId = param.catalogId ?? defaultCatalog;
    metadata.exception = null;
    metadata.outdatedData = metadata.outdatedData.filter(id => id !== catalogId);
  }

  protected async loader({ projectId, connectionId, catalogId }: ObjectContainerParams): Promise<DataValue> {
    const { navGetStructContainers } = await this.graphQLService.sdk.navGetStructContainers({
      projectId,
      connectionId,
      catalogId,
      withDetails: false,
    });

    this.data.set(serializeKey({ projectId, connectionId }), {
      catalogList: navGetStructContainers.catalogList,
      schemaList: navGetStructContainers.schemaList,
      supportsCatalogChange: navGetStructContainers.supportsCatalogChange,
      supportsSchemaChange: navGetStructContainers.supportsSchemaChange,
      activeCatalog: catalogId || undefined,
    });

    return this.data;
  }

  isKeyEqual(param: ObjectContainerParams, second: ObjectContainerParams): boolean {
    return (
      param.projectId === second.projectId
      && param.connectionId === second.connectionId
      && param.catalogId === second.catalogId
    );
  }
}

function serializeKey(key: ObjectContainerParams): string {
  return `${key.projectId}:${key.connectionId}`;
}
