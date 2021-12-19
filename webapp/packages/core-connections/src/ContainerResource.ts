/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
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
type DataValue = MetadataMap<string, ICatalogData[]>;

const defaultCatalog = 'default';

interface ObjectContainerParams {
  connectionId: string;
  catalogId?: string;
}

interface ObjectContainerMetadata extends ICachedResourceMetadata {
  outdatedData: string[];
  loadingData: string[];
}

@injectable()
export class ContainerResource extends CachedDataResource<
DataValue,
ObjectContainerParams,
string
> {
  metadata: MetadataMap<string, ObjectContainerMetadata>;

  constructor(
    private graphQLService: GraphQLService,
    private connectionInfoResource: ConnectionInfoResource
  ) {
    super(new MetadataMap(() => []));

    this.metadata = new MetadataMap(() => ({
      outdated: true,
      loading: false,
      exception: null,
      outdatedData: [],
      loadingData: [],
      includes: observable([]),
    }));

    this.preloadResource(connectionInfoResource, () => CachedMapAllKey);

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

  get({ connectionId, catalogId }: ObjectContainerParams): ICatalogData[] | undefined {
    return this.data.get(connectionId);
  }

  getCatalogData(
    connectionId: string,
    catalogId: string
  ): ICatalogData | undefined {
    const connectionData = this.data.get(connectionId);

    return connectionData.find(catalog => catalog.catalog.name === catalogId);
  }

  isLoaded({ connectionId, catalogId }: ObjectContainerParams): boolean {
    return (catalogId ?? defaultCatalog) in this.data.get(connectionId);
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

    this.data.set(connectionId, navGetStructContainers.catalogList);

    return this.data;
  }

  protected includes(param: ObjectContainerParams, second: ObjectContainerParams): boolean {
    return param.connectionId === second.connectionId && param.catalogId === second.catalogId;
  }
}
