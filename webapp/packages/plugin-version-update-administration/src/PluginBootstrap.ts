/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { VersionUpdateService } from '@cloudbeaver/core-version-update';
import { ProductInfoService } from '@cloudbeaver/plugin-product-information-administration';

const DockerUpdateInstructions = importLazyComponent(() => import('./DockerUpdateInstructions.js').then(m => m.DockerUpdateInstructions));
const VersionUpdate = importLazyComponent(() => import('./VersionUpdate.js').then(m => m.VersionUpdate));

export class PluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly versionUpdateService: VersionUpdateService,
    private readonly productInfoService: ProductInfoService,
  ) {
    super();
  }

  override register(): void {
    this.productInfoService.addSubItem({
      key: 'version-update',
      name: 'plugin_version_update_administration_tab_title',
      panel: () => VersionUpdate,
      order: 3,
    });

    this.versionUpdateService.registerGeneralInstruction(() => DockerUpdateInstructions);
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-version-update-administration/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [VersionUpdateService, ProductInfoService] as const;
  static readonly make: Effect.Effect<
    PluginBootstrapImpl,
    never,
    Context.Service.Identifier<typeof VersionUpdateService> | Context.Service.Identifier<typeof ProductInfoService>
  > = Effect.gen(function* makePluginBootstrap() {
    const versionUpdateService = yield* VersionUpdateService;
    const productInfoService = yield* ProductInfoService;

    return new PluginBootstrapImpl(versionUpdateService, productInfoService);
  });
  static readonly layer: Layer.Layer<
    PluginBootstrapDI,
    never,
    Context.Service.Identifier<typeof VersionUpdateService> | Context.Service.Identifier<typeof ProductInfoService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
