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
import { EPermission, PermissionsResource } from '@cloudbeaver/core-root';
import {
  GraphQLService,
  CachedDataResource,
  NavNodeInfoFragment, ICachedResourceMetadata, ResourceKeyUtils, CachedMapAllKey
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionInfoResource } from './ConnectionInfoResource';

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
    permissionsResource: PermissionsResource,
  ) {
    super(new Map());

    this.metadata = new MetadataMap(() => ({
      outdated: true,
      loading: false,
      exception: null,
      outdatedData: [],
      loadingData: [],
      includes: observable([]),
    }));

    permissionsResource.require(this, EPermission.public);
    this.preloadResource(connectionInfoResource, () => CachedMapAllKey);
    this.before(ExecutorInterrupter.interrupter(key => !connectionInfoResource.isConnected(key.connectionId)));

    this.connectionInfoResource.onItemDelete.addHandler(
      key => ResourceKeyUtils.forEach(key, key => this.data.delete(key))
    );
    this.connectionInfoResource.onItemAdd.addHandler(
      key => ResourceKeyUtils.forEach(key, key => {
        if (!this.connectionInfoResource.get(key)?.connected) {
          this.data.delete(key);
        }
      })
    );
  }

  get({ connectionId, catalogId }: ObjectContainerParams): IStructContainers | undefined {
    return this.data.get(connectionId);
  }

  getSchema(
    connectionId: string,
    schemaId: string
  ): ObjectContainer | undefined {
    const connectionData = this.data.get(connectionId);

    return connectionData?.schemaList.find(schema => schema.name === schemaId);
  }

  getCatalogData(
    connectionId: string,
    catalogId: string
  ): ICatalogData | undefined {
    const connectionData = this.data.get(connectionId);

    return connectionData?.catalogList.find(catalog => catalog.catalog.name === catalogId);
  }

  isLoaded({ connectionId, catalogId }: ObjectContainerParams): boolean {
    const container = this.data.get(connectionId);

    if (!container) {
      return false;
    }

    return container.activeCatalog === (catalogId ?? defaultCatalog);
  }

  isOutdated(param: ObjectContainerParams): boolean {
    const metadata = this.metadata.get(param.connectionId);
    const catalogId = param.catalogId ?? defaultCatalog;
    return metadata.outdatedData.includes(catalogId);
  }

  isDataLoading(param: ObjectContainerParams): boolean {
    const metadata = this.metadata.get(param.connectionId);
    const catalogId = param.catalogId ?? defaultCatalog;
    return metadata.loadingData.includes(catalogId);
  }

  markDataLoading(param: ObjectContainerParams): void {
    const metadata = this.metadata.get(param.connectionId);
    const catalogId = param.catalogId ?? defaultCatalog;

    if (!metadata.loadingData.includes(catalogId)) {
      metadata.loadingData.push(catalogId);
    }
  }

  markDataLoaded(param: ObjectContainerParams): void {
    const metadata = this.metadata.get(param.connectionId);
    const catalogId = param.catalogId ?? defaultCatalog;
    metadata.loadingData = metadata.loadingData.filter(id => id !== catalogId);
  }

  markOutdated(param: ObjectContainerParams): void {
    const catalogId = param.catalogId ?? defaultCatalog;

    const metadata = this.metadata.get(param.connectionId);
    if (!metadata.outdatedData.includes(catalogId)) {
      metadata.outdatedData.push(catalogId);
    }
    this.onDataOutdated.execute(param);
  }

  markUpdated(param: ObjectContainerParams): void {
    const metadata = this.metadata.get(param.connectionId);
    const catalogId = param.catalogId ?? defaultCatalog;
    metadata.exception = null;
    metadata.outdatedData = metadata.outdatedData.filter(id => id !== catalogId);
  }

  protected async loader({ connectionId, catalogId }: ObjectContainerParams): Promise<DataValue> {
    const { navGetStructContainers } = await this.graphQLService.sdk.navGetStructContainers({
      connectionId,
      catalogId,
      withDetails: false,
    });

    this.data.set(connectionId, {
      catalogList: navGetStructContainers.catalogList,
      schemaList: navGetStructContainers.schemaList,
      supportsCatalogChange: navGetStructContainers.supportsCatalogChange,
      supportsSchemaChange: navGetStructContainers.supportsSchemaChange,
      activeCatalog: catalogId || undefined,
    });

    return this.data;
  }

  protected includes(param: ObjectContainerParams, second: ObjectContainerParams): boolean {
    return param.connectionId === second.connectionId && param.catalogId === second.catalogId;
  }
}
