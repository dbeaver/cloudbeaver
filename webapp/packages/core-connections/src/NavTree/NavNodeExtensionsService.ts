/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import type { IExtension } from '@cloudbeaver/core-extensions';
import { NavNodeInfoResource, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { projectProvider } from '@cloudbeaver/core-projects';

import type { IConnectionInfoParams } from '../CONNECTION_INFO_PARAM_SCHEMA.js';
import { ConnectionInfoResource } from '../ConnectionInfoResource.js';
import { connectionProvider } from '../extensions/IConnectionProvider.js';
import { objectCatalogProvider } from '../extensions/IObjectCatalogProvider.js';
import { objectSchemaProvider } from '../extensions/IObjectSchemaProvider.js';

export class NavNodeExtensionsServiceImpl {
  readonly extensions: Array<IExtension<string>>;

  constructor(
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    this.extensions = [
      projectProvider(this.getProject.bind(this)),
      connectionProvider(this.getConnection.bind(this)),
      objectCatalogProvider(this.getDBObjectCatalog.bind(this)),
      objectSchemaProvider(this.getDBObjectSchema.bind(this)),
    ];
  }

  getProject(navNodeId: string): string | undefined {
    const node = this.navNodeInfoResource.get(navNodeId);

    return node?.projectId;
  }

  getConnection(navNodeId: string): IConnectionInfoParams | undefined {
    const node = this.navNodeInfoResource.get(navNodeId);

    if (!node?.projectId) {
      return;
    }

    const connectionKey = this.connectionInfoResource.getConnectionIdForNodeId(node.projectId, node.uri);

    if (!connectionKey) {
      return;
    }

    return connectionKey;
  }

  getDBObjectCatalog(navNodeId: string) {
    const nodeInfo = this.navNodeManagerService.getNodeContainerInfo(navNodeId);

    return nodeInfo.catalogId;
  }

  getDBObjectSchema(navNodeId: string) {
    const nodeInfo = this.navNodeManagerService.getNodeContainerInfo(navNodeId);

    return nodeInfo.schemaId;
  }
}

export type NavNodeExtensionsService = NavNodeExtensionsServiceImpl;

export class NavNodeExtensionsServiceDI extends Context.Service<NavNodeExtensionsServiceDI, NavNodeExtensionsServiceImpl>()(
  '@cloudbeaver/core-connections/NavTree/NavNodeExtensionsService#NavNodeExtensionsService',
) {
  static readonly implementation = NavNodeExtensionsServiceImpl;

  static readonly dependencies = () => [NavNodeInfoResource, NavNodeManagerService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    NavNodeExtensionsServiceImpl,
    never,
    | Context.Service.Identifier<typeof NavNodeInfoResource>
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeNavNodeExtensionsService() {
    const navNodeInfoResource = yield* NavNodeInfoResource;
    const navNodeManagerService = yield* NavNodeManagerService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new NavNodeExtensionsServiceImpl(navNodeInfoResource, navNodeManagerService, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    NavNodeExtensionsServiceDI,
    never,
    | Context.Service.Identifier<typeof NavNodeInfoResource>
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavNodeExtensionsService = NavNodeExtensionsServiceDI;
