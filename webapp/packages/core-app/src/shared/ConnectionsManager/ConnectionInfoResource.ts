/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  ConnectionInfo,
  GraphQLService,
  CachedMapResource,
} from '@cloudbeaver/core-sdk';

export type Connection = Pick<ConnectionInfo, 'id' | 'name' | 'connected' | 'driverId' | 'features'>

@injectable()
export class ConnectionInfoResource extends CachedMapResource<string, Connection> {
  constructor(private graphQLService: GraphQLService) {
    super(new Map());
  }

  protected async loader(connectionId: string): Promise<Map<string, Connection>> {
    const { connection } = await this.graphQLService.gql.connectionState({ id: connectionId });
    this.set(connectionId, connection);

    return this.data;
  }
}
