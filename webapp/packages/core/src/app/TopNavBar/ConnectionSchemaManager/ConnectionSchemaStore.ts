/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';

import { OrderedMap } from '@dbeaver/core/utils';

import { Connection, ICatalogsAndSchemas, ISchema } from '../../shared/ConnectionsManager/ConnectionsManagerService';

export interface IConnectionWithIcon extends Connection {
  icon?: string;
}

interface IListsParams {
  connectionId: string | null;
  catalogId: string | null;
}

export class ConnectionSchemaStore {

  private connectionsMap = new OrderedMap<string, IConnectionWithIcon>(c => c.id);
  private schemaMap = new OrderedMap<string, ISchema>(s => s.id);
  private catalogsMap = new OrderedMap<string, ISchema>(s => s.id);

  listsParams: IListsParams = {
    connectionId: null,
    catalogId: null,
  };

  get schemaList(): ISchema[] {
    return this.schemaMap.values;
  }

  get connectionsList() {
    return this.connectionsMap.values;
  }

  get catalogsList() {
    return this.catalogsMap.values;
  }

  getConnectionById(connectionId: string | null): IConnectionWithIcon | null {
    if (connectionId == null) {
      return null;
    }
    return this.connectionsMap.get(connectionId) || null;
  }

  @action updateIcon(connectionId: string, icon?: string) {
    const connection = this.getConnectionById(connectionId);
    if (connection) {
      connection.icon = icon;
    }
  }

  @action
  setSchemasAndCatalogs(params: IListsParams, catalogsAndSchemas: ICatalogsAndSchemas): void {
    this.listsParams = params;
    this.schemaMap.bulkRewrite(catalogsAndSchemas.schemas);
    this.catalogsMap.bulkRewrite(catalogsAndSchemas.catalogs);
  }

  @action
  addConnection(connection: IConnectionWithIcon) {
    this.connectionsMap.addValue(connection);
  }

  @action
  removeConnection(connectionId: string) {
    this.connectionsMap.remove(connectionId);
  }
}
