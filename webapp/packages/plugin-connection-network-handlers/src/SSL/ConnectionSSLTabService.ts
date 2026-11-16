/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { DBDriverResource } from '@cloudbeaver/core-connections';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ConnectionFormService, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { NetworkHandlerResource } from '@cloudbeaver/plugin-network-handlers';
import { getSSLDriverHandler } from './getSSLDriverHandler.js';

const SSLTab = React.lazy(async () => {
  const { SSLTab } = await import('./SSLTab.js');
  return { default: SSLTab };
});

const SSLPanel = React.lazy(async () => {
  const { SSLPanel } = await import('./SSLPanel.js');
  return { default: SSLPanel };
});

export class ConnectionSSLTabServiceImpl extends Bootstrap {
  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly networkHandlerResource: NetworkHandlerResource,
    private readonly connectionFormService: ConnectionFormService,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'ssl',
      order: 4,
      tab: () => SSLTab,
      panel: () => SSLPanel,
      getLoader: () => [
        getCachedMapResourceLoaderState(this.dbDriverResource, () => CachedMapAllKey),
        getCachedMapResourceLoaderState(this.networkHandlerResource, () => CachedMapAllKey),
      ],
      isHidden: (_, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        if (optionsPart?.state.driverId) {
          const driver = this.dbDriverResource.get(optionsPart.state.driverId);
          const handler = getSSLDriverHandler(this.networkHandlerResource.values, driver?.applicableNetworkHandlers ?? []);

          return !handler;
        }

        return true;
      },
    });
  }
}

export type ConnectionSSLTabService = ConnectionSSLTabServiceImpl;

export class ConnectionSSLTabServiceDI extends Context.Service<ConnectionSSLTabServiceDI, ConnectionSSLTabServiceImpl>()(
  '@cloudbeaver/plugin-connection-network-handlers/SSL/ConnectionSSLTabService#ConnectionSSLTabService',
) {
  static readonly implementation = ConnectionSSLTabServiceImpl;

  static readonly dependencies = () => [DBDriverResource, NetworkHandlerResource, ConnectionFormService] as const;
  static readonly make: Effect.Effect<
    ConnectionSSLTabServiceImpl,
    never,
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof NetworkHandlerResource>
    | Context.Service.Identifier<typeof ConnectionFormService>
  > = Effect.gen(function* makeConnectionSSLTabService() {
    const dbDriverResource = yield* DBDriverResource;
    const networkHandlerResource = yield* NetworkHandlerResource;
    const connectionFormService = yield* ConnectionFormService;

    return new ConnectionSSLTabServiceImpl(dbDriverResource, networkHandlerResource, connectionFormService);
  });
  static readonly layer: Layer.Layer<
    ConnectionSSLTabServiceDI,
    never,
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof NetworkHandlerResource>
    | Context.Service.Identifier<typeof ConnectionFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionSSLTabService = ConnectionSSLTabServiceDI;
