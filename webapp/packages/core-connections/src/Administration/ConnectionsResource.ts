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
  ConnectionInfo,
  ConnectionConfig,
  CachedMapResource,
  ResourceKey,
  isResourceKeyList,
} from '@cloudbeaver/core-sdk';
import { uuid } from '@cloudbeaver/core-utils';

@injectable()
export class ConnectionsResource extends CachedMapResource<string, ConnectionInfo> {
  constructor(
    private graphQLService: GraphQLService,
  ) {
    super(new Map());
  }

  isNew(id: string) {
    return id.startsWith('new-');
  }

  addNew() {
    const connectionInfo = {
      id: `new-${uuid()}`,
      name: 'New connection',
    } as ConnectionInfo;

    this.data.set(connectionInfo.id, connectionInfo);
    this.markUpdated(connectionInfo.id);

    return connectionInfo;
  }

  async loadAll() {
    await this.load('all');
    return this.data;
  }

  async create(config: ConnectionConfig, id?: string) {
    const { connection } = await this.graphQLService.gql.createConnectionConfiguration({ config });

    if (id) {
      this.data.delete(id);
    }
    this.data.set(connection.id, connection as ConnectionInfo);

    return this.get(connection.id)!;
  }

  async update(id: string, config: ConnectionConfig) {
    await this.performUpdate(id, async () => {
      await this.setActivePromise<void>(id, this.updateConnection(id, config));
    });
    return this.get(id)!;
  }

  async delete(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      for (let i = 0; i < key.list.length; i++) {
        this.data.delete(key.list[i]);
        if (!this.isNew(key.list[i])) {
          await this.graphQLService.gql.deleteConnectionConfiguration({ id: key.list[i] });
        }
      }
    } else {
      this.data.delete(key);
      if (!this.isNew(key)) {
        await this.graphQLService.gql.deleteConnectionConfiguration({ id: key });
      }
    }
    this.markUpdated(key);
    this.itemDeleteSubject.next(key);
  }

  protected async loader(key: ResourceKey<string>): Promise<Map<string, ConnectionInfo>> {
    const { connections } = await this.graphQLService.gql.getConnections();
    this.data.clear();

    for (const connection of connections) {
      this.set(connection.id, connection as ConnectionInfo);
    }
    this.markUpdated(key);

    return this.data;
  }

  private async updateConnection(id: string, config: ConnectionConfig) {
    const { connection } = await this.graphQLService.gql.updateConnectionConfiguration({ id, config });

    this.set(id, connection as ConnectionInfo);
  }
}
