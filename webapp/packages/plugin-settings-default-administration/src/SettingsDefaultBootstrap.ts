/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ServerSettingsService } from '@cloudbeaver/core-root';
import { SettingsAdministrationService } from '@cloudbeaver/plugin-settings-administration';

export class SettingsDefaultAdministrationBootstrapImpl extends Bootstrap {
  constructor(
    private readonly settingsAdministrationService: SettingsAdministrationService,
    private readonly serverSettingsService: ServerSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.settingsAdministrationService.tabsContainer.add({
      key: 'default',
      name: 'plugin_settings_default_administration_settings_tab_name',
      order: 0,
      options: {
        source: this.serverSettingsService,
        accessor: ['server'],
      },
      panel: () => () => null,
    });
  }
}

export type SettingsDefaultAdministrationBootstrap = SettingsDefaultAdministrationBootstrapImpl;

export class SettingsDefaultAdministrationBootstrapDI extends Context.Service<
  SettingsDefaultAdministrationBootstrapDI,
  SettingsDefaultAdministrationBootstrapImpl
>()('@cloudbeaver/plugin-settings-default-administration/SettingsDefaultBootstrap#SettingsDefaultAdministrationBootstrap') {
  static readonly implementation = SettingsDefaultAdministrationBootstrapImpl;

  static readonly dependencies = () => [SettingsAdministrationService, ServerSettingsService] as const;
  static readonly make: Effect.Effect<
    SettingsDefaultAdministrationBootstrapImpl,
    never,
    Context.Service.Identifier<typeof SettingsAdministrationService> | Context.Service.Identifier<typeof ServerSettingsService>
  > = Effect.gen(function* makeSettingsDefaultAdministrationBootstrap() {
    const settingsAdministrationService = yield* SettingsAdministrationService;
    const serverSettingsService = yield* ServerSettingsService;

    return new SettingsDefaultAdministrationBootstrapImpl(settingsAdministrationService, serverSettingsService);
  });
  static readonly layer: Layer.Layer<
    SettingsDefaultAdministrationBootstrapDI,
    never,
    Context.Service.Identifier<typeof SettingsAdministrationService> | Context.Service.Identifier<typeof ServerSettingsService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsDefaultAdministrationBootstrap = SettingsDefaultAdministrationBootstrapDI;
