/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerConfigurationConfigurationService } from '@cloudbeaver/plugin-administration';

const ResourceManagerSettings = importLazyComponent(() => import('./ResourceManagerSettings.js').then(m => m.ResourceManagerSettings));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly serverConfigurationConfigurationService: ServerConfigurationConfigurationService) {
    super();
  }

  override register(): void | Promise<void> {
    this.serverConfigurationConfigurationService.workspaceContainer.add(ResourceManagerSettings, 0);
  }

  override async load(): Promise<void> {}
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-resource-manager-administration/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [ServerConfigurationConfigurationService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof ServerConfigurationConfigurationService>> =
    Effect.gen(function* makePluginBootstrap() {
      const serverConfigurationConfigurationService = yield* ServerConfigurationConfigurationService;

      return new PluginBootstrapImpl(serverConfigurationConfigurationService);
    });
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof ServerConfigurationConfigurationService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const PluginBootstrap = PluginBootstrapDI;
