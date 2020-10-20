/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Observable, Subject } from 'rxjs';

import { injectable } from '@cloudbeaver/core-di';
import {
  ConnectionInfo,
  GraphQLService,
  CachedMapResource,
  ObjectPropertyInfo,
  ResourceKey,
  isResourceKeyList,
  resourceKeyList, ConnectionConfig
} from '@cloudbeaver/core-sdk';

import { ConnectionsResource } from './Administration/ConnectionsResource';
import { IDBAuthConfig } from './DatabaseAuthDialog/DBAuthConfig';

export type Connection = Pick<
ConnectionInfo,
'id' |
'name' |
'description' |
'connected' |
'readOnly' |
'driverId' |
'authModel' |
'authNeeded' |
'features' |
'supportedDataFormats'
> & { authProperties?: ObjectPropertyInfo[] };

@injectable()
export class ConnectionInfoResource extends CachedMapResource<string, Connection> {
  readonly onConnectionCreate: Observable<Connection>;
  private connectionCreateSubject: Subject<Connection>;
  constructor(
    private graphQLService: GraphQLService,
    private connectionsResource: ConnectionsResource
  ) {
    super(new Map());
    this.connectionCreateSubject = new Subject<Connection>();
    this.onConnectionCreate = this.connectionCreateSubject.asObservable();
    connectionsResource.onConnectionCreate.subscribe(this.createHandler.bind(this));
    connectionsResource.onItemAdd.subscribe(this.addHandler.bind(this));
    connectionsResource.onItemDelete.subscribe(this.delete.bind(this));
    connectionsResource.onDataOutdated.subscribe(this.markOutdated.bind(this));
  }

  async createFromTemplate(templateId: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnectionFromTemplate({ templateId });
    this.set(connection.id, connection);

    const observedConnection = this.get(connection.id)!;
    this.connectionCreateSubject.next(observedConnection);
    return observedConnection;
  }

  async createConnection(config: ConnectionConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.createConnection({
      config,
    });
    this.set(connection.id, connection);

    const observedConnection = this.get(connection.id)!;
    this.connectionCreateSubject.next(observedConnection);
    return observedConnection;
  }

  async init(id: string, config?: IDBAuthConfig): Promise<Connection> {
    await this.performUpdate(id, async () => {
      const connection = await this.initConnection(id, config);
      this.set(id, connection);
      return connection;
    });

    return this.get(id)!;
  }

  async close(connectionId: string) {
    await this.performUpdate(connectionId, async () => {
      const connection = await this.closeConnection(connectionId);
      this.set(connectionId, connection);
    });

    return this.get(connectionId)!;
  }

  async deleteConnection(connectionId: string) {
    await this.performUpdate(connectionId, async () => {
      await this.graphQLService.sdk.deleteConnection({ id: connectionId });
    });
    this.delete(connectionId);
  }

  async loadAuthModel(connectionId: string): Promise<ObjectPropertyInfo[]> {
    const connection = await this.load(connectionId);

    if (connection?.authProperties) {
      return connection.authProperties;
    }

    return this.performUpdate(connectionId, async () => {
      connection.authProperties = await this.getAuthProperties(connectionId);
      this.set(connectionId, connection);

      return connection.authProperties!;
    });
  }

  protected async loader(connectionId: string): Promise<Map<string, Connection>> {
    const { connection } = await this.graphQLService.sdk.connectionInfo({ id: connectionId });

    const oldConnection = this.get(connectionId) || {};
    this.set(connectionId, { ...oldConnection, ...connection });

    return this.data;
  }

  private async createHandler(connection: ConnectionInfo) {
    if (connection.template) {
      return;
    }

    await this.load(connection.id);
    const observedConnection = this.get(connection.id) as Connection;
    this.connectionCreateSubject.next(observedConnection);
  }

  private async addHandler(key: ResourceKey<string>) {
    if (isResourceKeyList(key)) {
      this.load(resourceKeyList(key.list.filter(id => !this.connectionsResource.get(id)?.template)));
      return;
    }

    if (this.connectionsResource.get(key)?.template) {
      return;
    }

    this.load(key);
  }

  private async getAuthProperties(id: string): Promise<ObjectPropertyInfo[]> {
    const { connection: { authProperties } } = await this.graphQLService.sdk.connectionAuthProperties({ id });

    return authProperties;
  }

  private async initConnection(id: string, config?: IDBAuthConfig): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.initConnection({ id, ...config });

    return connection;
  }

  private async closeConnection(id: string): Promise<Connection> {
    const { connection } = await this.graphQLService.sdk.closeConnection({ id });

    return connection;
  }
}
