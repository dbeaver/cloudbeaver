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
  DatabaseObjectInfo,
} from '@cloudbeaver/core-sdk';

export type ObjectContainer = Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>

type ObjectContainerParams = {
  connectionId: string;
  catalogId?: string;
}

@injectable()
export class ContainerResource extends CachedDataResource<Map<string, ObjectContainer[]>, ObjectContainerParams> {
  constructor(private graphQLService: GraphQLService) {
    super(new Map());
  }

  isLoaded({ connectionId }: ObjectContainerParams) {
    return this.data.has(connectionId);
  }

  protected async loader({ connectionId, catalogId }: ObjectContainerParams): Promise<Map<string, ObjectContainer[]>> {
    const { navGetStructContainers } = await this.graphQLService.sdk.navGetStructContainers({
      connectionId,
      catalogId,
    });
    this.data.set(connectionId, [...navGetStructContainers.schemaList, ...navGetStructContainers.catalogList]);

    return this.data;
  }
}
