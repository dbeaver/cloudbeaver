/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { DataExportMenuService } from './DataExportMenuService.js';

export class PluginBootstrapImpl extends Bootstrap {
  constructor(private readonly dataExportMenuService: DataExportMenuService) {
    super();
  }

  override register(): void {
    this.dataExportMenuService.register();
  }
}

export type PluginBootstrap = PluginBootstrapImpl;

export class PluginBootstrapDI extends Context.Service<PluginBootstrapDI, PluginBootstrapImpl>()(
  '@cloudbeaver/plugin-data-export/PluginBootstrap#PluginBootstrap',
) {
  static readonly implementation = PluginBootstrapImpl;

  static readonly dependencies = () => [DataExportMenuService] as const;
  static readonly make: Effect.Effect<PluginBootstrapImpl, never, Context.Service.Identifier<typeof DataExportMenuService>> = Effect.gen(
    function* makePluginBootstrap() {
      const dataExportMenuService = yield* DataExportMenuService;

      return new PluginBootstrapImpl(dataExportMenuService);
    },
  );
  static readonly layer: Layer.Layer<PluginBootstrapDI, never, Context.Service.Identifier<typeof DataExportMenuService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginBootstrap = PluginBootstrapDI;
