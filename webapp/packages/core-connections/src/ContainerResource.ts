/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  GraphQLService,
  CachedDataResource,
  DatabaseObjectInfo, ICachedResourceMetadata, ResourceKeyUtils
} from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { ConnectionInfoResource } from './ConnectionInfoResource';

export type ObjectContainer = Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>;
type DataValue = MetadataMap<string, Record<string, ObjectContainer[]>>;

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
    super(new MetadataMap(() => ({ })));
    this.metadata = new MetadataMap(() => ({ outdated: true, loading: false, outdatedData: [], loadingData: [] }));
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

  get({ connectionId, catalogId }: ObjectContainerParams): ObjectContainer[] | undefined {
    return this.data.get(connectionId)[catalogId ?? defaultCatalog];
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
    metadata.outdatedData = metadata.outdatedData.filter(id => id !== catalogId);
  }

  protected async loader({ connectionId, catalogId }: ObjectContainerParams): Promise<DataValue> {
    const { navGetStructContainers } = await this.graphQLService.sdk.navGetStructContainers({
      connectionId,
      catalogId,
    });
    const value = this.data.get(connectionId);
    value[catalogId ?? defaultCatalog] = [...navGetStructContainers.schemaList, ...navGetStructContainers.catalogList];

    return this.data;
  }

  protected includes(param: ObjectContainerParams, second: ObjectContainerParams): boolean {
    return param.connectionId === second.connectionId && param.catalogId === second.catalogId;
  }
}
