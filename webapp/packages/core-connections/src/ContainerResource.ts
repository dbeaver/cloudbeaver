/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AppAuthService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { CachedMapResource, isResourceAlias, type ResourceKey, resourceKeyList, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import { GraphQLService, type NavNodeInfoFragment } from '@cloudbeaver/core-sdk';
import { isNull } from '@cloudbeaver/core-utils';

import type { IConnectionInfoParams } from './CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionInfoActiveProjectKey, ConnectionInfoResource, createConnectionParam } from './ConnectionInfoResource.js';

export type ObjectContainer = NavNodeInfoFragment;
export interface ICatalogData {
  catalog: ObjectContainer;
  schemaList: ObjectContainer[];
}

export interface IStructContainers {
  parentNode: ObjectContainer | null;
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

@injectable()
export class ContainerResource extends CachedMapResource<ObjectContainerParams, IStructContainers> {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly navTreeResource: NavTreeResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    appAuthService: AppAuthService,
  ) {
    super();

    appAuthService.requireAuthentication(this);
    this.preloadResource(navTreeResource, key => {
      if (isResourceAlias(key)) {
        return '';
      }
      return ResourceKeyUtils.mapKey(
        key,
        key => this.connectionInfoResource.get(createConnectionParam(key.projectId, key.connectionId))?.nodePath || '',
      );
    });
    this.navTreeResource.onDataOutdated.addHandler(key => {
      ResourceKeyUtils.forEach(key, key => {
        if (isResourceAlias(key)) {
          return;
        }
        const connection = this.connectionInfoResource.getConnectionForNode(key);

        if (!connection) {
          return;
        }

        this.markOutdated(resourceKeyList(this.keys.filter(key => key.projectId === connection.projectId && key.connectionId === connection.id)));
      });
    });
    this.preloadResource(connectionInfoResource, () => ConnectionInfoActiveProjectKey);
    this.before(
      ExecutorInterrupter.interrupter(key => {
        if (isResourceAlias(key)) {
          return false;
        }
        return !connectionInfoResource.isConnected(ResourceKeyUtils.mapKey(key, key => createConnectionParam(key.projectId, key.connectionId)));
      }),
    );

    this.connectionInfoResource.onItemDelete.addHandler(key =>
      ResourceKeyUtils.forEach(key, key => this.delete({ projectId: key.projectId, connectionId: key.connectionId })),
    );
    this.connectionInfoResource.onItemUpdate.addHandler(key =>
      ResourceKeyUtils.forEach(key, key => {
        if (!this.connectionInfoResource.isConnected(key)) {
          this.delete({ projectId: key.projectId, connectionId: key.connectionId });
        }
      }),
    );

    this.connectionInfoResource.onClear.addHandler(() => this.clear());
  }

  getSchema(connectionKey: IConnectionInfoParams, schemaId: string): ObjectContainer | undefined {
    const connectionData = this.get(connectionKey);

    return connectionData?.schemaList.find(schema => schema.name === schemaId);
  }

  getCatalogData(connectionKey: IConnectionInfoParams, catalogId: string): ICatalogData | undefined {
    const connectionData = this.get({ ...connectionKey, catalogId });

    return connectionData?.catalogList.find(catalog => catalog.catalog.name === catalogId);
  }

  protected async loader(originalKey: ResourceKey<ObjectContainerParams>): Promise<Map<ObjectContainerParams, IStructContainers>> {
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
        withFilters: false,
      });

      containers.set(
        { projectId, connectionId, catalogId },
        {
          parentNode: navGetStructContainers.parentNode ?? null,
          catalogList: navGetStructContainers.catalogList,
          schemaList: navGetStructContainers.schemaList,
          supportsCatalogChange: navGetStructContainers.supportsCatalogChange,
          supportsSchemaChange: navGetStructContainers.supportsSchemaChange,
          activeCatalog: catalogId || undefined,
        },
      );
    });

    this.set(resourceKeyList([...containers.keys()]), [...containers.values()]);

    return this.data;
  }

  override isKeyEqual(param: ObjectContainerParams, second: ObjectContainerParams): boolean {
    return param.projectId === second.projectId && param.connectionId === second.connectionId && param.catalogId === second.catalogId;
  }

  protected validateKey(key: ObjectContainerParams): boolean {
    return (
      typeof key === 'object' &&
      typeof key.projectId === 'string' &&
      ['string'].includes(typeof key.connectionId) &&
      (['string', 'undefined'].includes(typeof key.catalogId) || isNull(key.catalogId))
    );
  }
}
