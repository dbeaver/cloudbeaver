/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ServerConfigurationFeatureGroupsService } from '@cloudbeaver/core-administration';
import { DBDriverResource, FEATURE_GROUP_CONNECTIONS_ID } from '@cloudbeaver/core-connections';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { DriverConfigurationType } from '@cloudbeaver/core-sdk';

import { ConnectionFormService, getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { SSH_TUNNEL_ID } from '@cloudbeaver/plugin-network-handlers';

import { FEATURE_SSH_ID } from '../FEATURE_SSH_ID.js';

const SSHTab = importLazyComponent(() => import('./SSHTab.js').then(m => m.SSHTab));
const SSHPanel = importLazyComponent(() => import('./SSHPanel.js').then(m => m.SSHPanel));

export class ConnectionSSHTabServiceImpl extends Bootstrap {
  constructor(
    private readonly dbDriverResource: DBDriverResource,
    private readonly connectionFormService: ConnectionFormService,
    private readonly serverConfigurationFeatureGroupsService: ServerConfigurationFeatureGroupsService,
  ) {
    super();
  }

  override register(): void {
    this.serverConfigurationFeatureGroupsService.assignFeaturesToGroup(FEATURE_GROUP_CONNECTIONS_ID, [FEATURE_SSH_ID]);

    this.connectionFormService.parts.add({
      key: 'ssh',
      name: 'plugin_connections_connection_form_part_main',
      title: 'plugin_connections_connection_form_part_main',
      order: 3,
      tab: () => SSHTab,
      panel: () => SSHPanel,
      getLoader: (_, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;
        return [getCachedMapResourceLoaderState(this.dbDriverResource, () => optionsPart?.state.driverId ?? null)];
      },
      isHidden: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        if (optionsPart?.state.driverId) {
          const driver = this.dbDriverResource.get(optionsPart.state.driverId);
          const urlType = optionsPart.state.configurationType === DriverConfigurationType.Url;

          return urlType || !driver?.applicableNetworkHandlers.includes(SSH_TUNNEL_ID);
        }

        return true;
      },
    });
  }
}

export type ConnectionSSHTabService = ConnectionSSHTabServiceImpl;

export class ConnectionSSHTabServiceDI extends Context.Service<ConnectionSSHTabServiceDI, ConnectionSSHTabServiceImpl>()(
  '@cloudbeaver/plugin-connection-network-handlers/SSH/ConnectionSSHTabService#ConnectionSSHTabService',
) {
  static readonly implementation = ConnectionSSHTabServiceImpl;
  static readonly dependencies = () => [DBDriverResource, ConnectionFormService, ServerConfigurationFeatureGroupsService] as const;
  static readonly make: Effect.Effect<
    ConnectionSSHTabServiceImpl,
    never,
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof ConnectionFormService>
    | Context.Service.Identifier<typeof ServerConfigurationFeatureGroupsService>
  > = Effect.gen(function* makeConnectionSSHTabService() {
    const dbDriverResource = yield* DBDriverResource;
    const connectionFormService = yield* ConnectionFormService;
    const serverConfigurationFeatureGroupsService = yield* ServerConfigurationFeatureGroupsService;
    return new ConnectionSSHTabServiceImpl(dbDriverResource, connectionFormService, serverConfigurationFeatureGroupsService);
  });
  static readonly layer: Layer.Layer<
    ConnectionSSHTabServiceDI,
    never,
    | Context.Service.Identifier<typeof DBDriverResource>
    | Context.Service.Identifier<typeof ConnectionFormService>
    | Context.Service.Identifier<typeof ServerConfigurationFeatureGroupsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionSSHTabService = ConnectionSSHTabServiceDI;
