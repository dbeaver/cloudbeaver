/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionFormService } from '../ConnectionFormService.js';
import { getConnectionFormOptionsPart } from '../Options/getConnectionFormOptionsPart.js';

const DriverProperties = importLazyComponent(() => import('./DriverProperties.js').then(m => m.DriverProperties));

export class ConnectionDriverPropertiesTabServiceImpl extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'driver_properties',
      name: 'plugin_connections_connection_form_part_properties',
      title: 'plugin_connections_connection_form_part_properties',
      icon: '/icons/plugin_connection_hex_nut.svg',
      order: 2,
      panel: () => DriverProperties,
      isDisabled: (tabId, props) => {
        const optionsPart = props?.formState ? getConnectionFormOptionsPart(props.formState) : null;

        if (optionsPart?.state.driverId) {
          return false;
        }

        return true;
      },
    });
  }
}

export type ConnectionDriverPropertiesTabService = ConnectionDriverPropertiesTabServiceImpl;

export class ConnectionDriverPropertiesTabServiceDI extends Context.Service<
  ConnectionDriverPropertiesTabServiceDI,
  ConnectionDriverPropertiesTabServiceImpl
>()('@cloudbeaver/plugin-connections/ConnectionForm/DriverProperties/ConnectionDriverPropertiesTabService#ConnectionDriverPropertiesTabService') {
  static readonly implementation = ConnectionDriverPropertiesTabServiceImpl;

  static readonly dependencies = () => [ConnectionFormService] as const;
  static readonly make: Effect.Effect<ConnectionDriverPropertiesTabServiceImpl, never, Context.Service.Identifier<typeof ConnectionFormService>> =
    Effect.gen(function* makeConnectionDriverPropertiesTabService() {
      const connectionFormService = yield* ConnectionFormService;

      return new ConnectionDriverPropertiesTabServiceImpl(connectionFormService);
    });
  static readonly layer: Layer.Layer<ConnectionDriverPropertiesTabServiceDI, never, Context.Service.Identifier<typeof ConnectionFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ConnectionDriverPropertiesTabService = ConnectionDriverPropertiesTabServiceDI;
