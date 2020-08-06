/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { connectionProvider } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { IExtension } from '@cloudbeaver/core-extensions';

import { objectCatalogProvider } from './extensions/IObjectCatalogProvider';
import { objectSchemaProvider } from './extensions/IObjectSchemaProvider';
import { NavNodeManagerService } from './NavNodeManagerService';
import { NodeManagerUtils } from './NodeManagerUtils';

@injectable()
export class NavNodeExtensionsService {
  readonly extensions: IExtension<string>[];

  constructor(
    private navNodeManagerService: NavNodeManagerService,
  ) {
    this.extensions = [
      connectionProvider(this.getConnection.bind(this)),
      objectCatalogProvider(this.getDBObjectCatalog.bind(this)),
      objectSchemaProvider(this.getDBObjectSchema.bind(this)),
    ];
  }

  getConnection(navNodeId: string) {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(navNodeId);

    if (!nodeInfo.connectionId) {
      return;
    }
    // connection node id differs from connection id
    return NodeManagerUtils.connectionNodeIdToConnectionId(nodeInfo.connectionId);
  }

  getDBObjectCatalog(navNodeId: string) {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(navNodeId);

    return nodeInfo.catalogId;
  }

  getDBObjectSchema(navNodeId: string) {
    const nodeInfo = this.navNodeManagerService
      .getNodeContainerInfo(navNodeId);

    return nodeInfo.schemaId;
  }
}
