/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ServerConfigurationFormService } from './ServerConfigurationFormService.js';
import type { IConfigurationPlaceholderProps } from './ServerConfigurationService.js';

const ServerConfigurationConfigurationPanel = importLazyComponent(() =>
  import('./ServerConfigurationConfigurationPanel.js').then(m => m.ServerConfigurationConfigurationPanel),
);

export class ServerConfigurationConfigurationServiceImpl {
  readonly settingsContainer = new PlaceholderContainer<IConfigurationPlaceholderProps>();
  readonly connectionsContainer = new PlaceholderContainer<IConfigurationPlaceholderProps>();
  readonly workspaceContainer = new PlaceholderContainer<IConfigurationPlaceholderProps>();

  constructor(private readonly serverConfigurationFormService: ServerConfigurationFormService) {}

  register(): void {
    this.serverConfigurationFormService.parts.add({
      key: 'configuration',
      name: 'administration_configuration_wizard_configuration_plugins',
      order: 1,
      panel: () => ServerConfigurationConfigurationPanel,
    });
  }
}

export type ServerConfigurationConfigurationService = ServerConfigurationConfigurationServiceImpl;

export class ServerConfigurationConfigurationServiceDI extends Context.Service<
  ServerConfigurationConfigurationServiceDI,
  ServerConfigurationConfigurationServiceImpl
>()(
  '@cloudbeaver/plugin-administration/ConfigurationWizard/ServerConfiguration/ServerConfigurationConfigurationService#ServerConfigurationConfigurationService',
) {
  static readonly implementation = ServerConfigurationConfigurationServiceImpl;
  static readonly dependencies = () => [ServerConfigurationFormService] as const;
  static readonly make: Effect.Effect<
    ServerConfigurationConfigurationServiceImpl,
    never,
    Context.Service.Identifier<typeof ServerConfigurationFormService>
  > = Effect.gen(function* makeServerConfigurationConfigurationService() {
    const serverConfigurationFormService = yield* ServerConfigurationFormService;
    return new ServerConfigurationConfigurationServiceImpl(serverConfigurationFormService);
  });
  static readonly layer: Layer.Layer<
    ServerConfigurationConfigurationServiceDI,
    never,
    Context.Service.Identifier<typeof ServerConfigurationFormService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServerConfigurationConfigurationService = ServerConfigurationConfigurationServiceDI;
