/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoOriginResource, isLocalConnection } from '@cloudbeaver/core-connections';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';
export const ConnectionFormAuthenticationAction = importLazyComponent(() =>
  import('./ConnectionFormAuthenticationAction.js').then(m => m.ConnectionFormAuthenticationAction),
);

const OriginInfo = importLazyComponent(() => import('./OriginInfo.js').then(m => m.OriginInfo));
const OriginInfoTab = importLazyComponent(() => import('./OriginInfoTab.js').then(m => m.OriginInfoTab));

export class ConnectionOriginInfoTabServiceImpl extends Bootstrap {
  constructor(
    private readonly connectionFormService: ConnectionFormService,
    private readonly connectionInfoOriginResource: ConnectionInfoOriginResource,
  ) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'origin',
      icon: '/icons/core_blocks_globe.svg',
      order: 5,
      tab: () => OriginInfoTab,
      panel: () => OriginInfo,
      getLoader: (context, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;
        const key = optionsPart?.connectionKey;

        if (!key) {
          return [];
        }

        return getCachedMapResourceLoaderState(this.connectionInfoOriginResource, () => key);
      },
      isHidden: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;
        const key = optionsPart?.connectionKey;
        const originInfo = key ? this.connectionInfoOriginResource.get(key) : null;

        if (!originInfo) {
          return true;
        }

        return isLocalConnection(originInfo.origin);
      },
    });

    this.connectionFormService.actionsContainer.add(ConnectionFormAuthenticationAction, 0);
  }
}

export type ConnectionOriginInfoTabService = ConnectionOriginInfoTabServiceImpl;

export class ConnectionOriginInfoTabServiceDI extends Context.Service<ConnectionOriginInfoTabServiceDI, ConnectionOriginInfoTabServiceImpl>()(
  '@cloudbeaver/plugin-connections/ConnectionForm/OriginInfo/ConnectionOriginInfoTabService#ConnectionOriginInfoTabService',
) {
  static readonly implementation = ConnectionOriginInfoTabServiceImpl;

  static readonly dependencies = () => [ConnectionFormService, ConnectionInfoOriginResource] as const;
  static readonly make: Effect.Effect<
    ConnectionOriginInfoTabServiceImpl,
    never,
    Context.Service.Identifier<typeof ConnectionFormService> | Context.Service.Identifier<typeof ConnectionInfoOriginResource>
  > = Effect.gen(function* makeConnectionOriginInfoTabService() {
    const connectionFormService = yield* ConnectionFormService;
    const connectionInfoOriginResource = yield* ConnectionInfoOriginResource;

    return new ConnectionOriginInfoTabServiceImpl(connectionFormService, connectionInfoOriginResource);
  });
  static readonly layer: Layer.Layer<
    ConnectionOriginInfoTabServiceDI,
    never,
    Context.Service.Identifier<typeof ConnectionFormService> | Context.Service.Identifier<typeof ConnectionInfoOriginResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionOriginInfoTabService = ConnectionOriginInfoTabServiceDI;
