/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ConnectionFormService } from '../ConnectionFormService.js';

const InitializationSettings = importLazyComponent(() => import('./InitializationSettings.js').then(m => m.InitializationSettings));

export class InitializationSettingsTabServiceImpl extends Bootstrap {
  constructor(private readonly connectionFormService: ConnectionFormService) {
    super();
  }

  override register(): void {
    this.connectionFormService.parts.add({
      key: 'initialization_settings',
      name: 'plugin_connections_connection_form_part_initialization_settings',
      title: 'plugin_connections_connection_form_part_initialization_settings',
      icon: '/icons/core_blocks_sliders.svg',
      order: 10,
      panel: () => InitializationSettings,
    });
  }
}

export type InitializationSettingsTabService = InitializationSettingsTabServiceImpl;

export class InitializationSettingsTabServiceDI extends Context.Service<InitializationSettingsTabServiceDI, InitializationSettingsTabServiceImpl>()(
  '@cloudbeaver/plugin-connections/ConnectionForm/InitializationSettings/InitializationSettingsTabService#InitializationSettingsTabService',
) {
  static readonly implementation = InitializationSettingsTabServiceImpl;

  static readonly dependencies = () => [ConnectionFormService] as const;
  static readonly make: Effect.Effect<InitializationSettingsTabServiceImpl, never, Context.Service.Identifier<typeof ConnectionFormService>> =
    Effect.gen(function* makeInitializationSettingsTabService() {
      const connectionFormService = yield* ConnectionFormService;

      return new InitializationSettingsTabServiceImpl(connectionFormService);
    });
  static readonly layer: Layer.Layer<InitializationSettingsTabServiceDI, never, Context.Service.Identifier<typeof ConnectionFormService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const InitializationSettingsTabService = InitializationSettingsTabServiceDI;
