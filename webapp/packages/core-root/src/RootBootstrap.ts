/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ROOT_SETTINGS_LAYER, SettingsManagerService, SettingsResolverService } from '@cloudbeaver/core-settings';

import { ServerDefaultSettingsService } from './Settings/ServerDefaultSettingsService.js';
import { ServerSettingsManagerService } from './Settings/ServerSettingsManagerService.js';
import { SERVER_SETTINGS_LAYER, ServerSettingsService } from './Settings/ServerSettingsService.js';

export class RootBootstrapImpl extends Bootstrap {
  constructor(
    private readonly settingsResolverService: SettingsResolverService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsManagerService: SettingsManagerService,
    private readonly serverSettingsManagerService: ServerSettingsManagerService,
    private readonly serverDefaultSettingsService: ServerDefaultSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.settingsManagerService.registerSettings(this.serverSettingsManagerService.getSettingsGetter(), this.serverSettingsManagerService.loaders);
    this.settingsResolverService.addResolver(SERVER_SETTINGS_LAYER, this.serverSettingsService);
    this.settingsResolverService.addResolver(ROOT_SETTINGS_LAYER, this.serverDefaultSettingsService);
  }
}

export type RootBootstrap = RootBootstrapImpl;

export class RootBootstrapDI extends Context.Service<RootBootstrapDI, RootBootstrapImpl>()('@cloudbeaver/core-root/RootBootstrap#RootBootstrap') {
  static readonly implementation = RootBootstrapImpl;

  static readonly dependencies = () =>
    [SettingsResolverService, ServerSettingsService, SettingsManagerService, ServerSettingsManagerService, ServerDefaultSettingsService] as const;
  static readonly make: Effect.Effect<
    RootBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof SettingsResolverService>
    | Context.Service.Identifier<typeof ServerSettingsService>
    | Context.Service.Identifier<typeof SettingsManagerService>
    | Context.Service.Identifier<typeof ServerSettingsManagerService>
    | Context.Service.Identifier<typeof ServerDefaultSettingsService>
  > = Effect.gen(function* makeRootBootstrap() {
    const settingsResolverService = yield* SettingsResolverService;
    const serverSettingsService = yield* ServerSettingsService;
    const settingsManagerService = yield* SettingsManagerService;
    const serverSettingsManagerService = yield* ServerSettingsManagerService;
    const serverDefaultSettingsService = yield* ServerDefaultSettingsService;

    return new RootBootstrapImpl(
      settingsResolverService,
      serverSettingsService,
      settingsManagerService,
      serverSettingsManagerService,
      serverDefaultSettingsService,
    );
  });
  static readonly layer: Layer.Layer<
    RootBootstrapDI,
    never,
    | Context.Service.Identifier<typeof SettingsResolverService>
    | Context.Service.Identifier<typeof ServerSettingsService>
    | Context.Service.Identifier<typeof SettingsManagerService>
    | Context.Service.Identifier<typeof ServerSettingsManagerService>
    | Context.Service.Identifier<typeof ServerDefaultSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const RootBootstrap = RootBootstrapDI;
