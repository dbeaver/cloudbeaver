/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { AdministrationTopAppBarService, WizardTopAppBarService } from '@cloudbeaver/plugin-administration';
import { LogoLazy } from '@cloudbeaver/plugin-app-logo';

export class AppLogoAdministrationPluginBootstrapImpl extends Bootstrap {
  constructor(
    private readonly administrationTopAppBarService: AdministrationTopAppBarService,
    private readonly wizardTopAppBarService: WizardTopAppBarService,
  ) {
    super();
  }

  override register() {
    this.administrationTopAppBarService.placeholder.add(LogoLazy, 0);
    this.wizardTopAppBarService.placeholder.add(LogoLazy, 0);
  }
}

export type AppLogoAdministrationPluginBootstrap = AppLogoAdministrationPluginBootstrapImpl;

export class AppLogoAdministrationPluginBootstrapDI extends Context.Service<
  AppLogoAdministrationPluginBootstrapDI,
  AppLogoAdministrationPluginBootstrapImpl
>()('@cloudbeaver/plugin-app-logo-administration/PluginBootstrap#AppLogoAdministrationPluginBootstrap') {
  static readonly implementation = AppLogoAdministrationPluginBootstrapImpl;

  static readonly dependencies = () => [AdministrationTopAppBarService, WizardTopAppBarService] as const;
  static readonly make: Effect.Effect<
    AppLogoAdministrationPluginBootstrapImpl,
    never,
    Context.Service.Identifier<typeof AdministrationTopAppBarService> | Context.Service.Identifier<typeof WizardTopAppBarService>
  > = Effect.gen(function* makeAppLogoAdministrationPluginBootstrap() {
    const administrationTopAppBarService = yield* AdministrationTopAppBarService;
    const wizardTopAppBarService = yield* WizardTopAppBarService;

    return new AppLogoAdministrationPluginBootstrapImpl(administrationTopAppBarService, wizardTopAppBarService);
  });
  static readonly layer: Layer.Layer<
    AppLogoAdministrationPluginBootstrapDI,
    never,
    Context.Service.Identifier<typeof AdministrationTopAppBarService> | Context.Service.Identifier<typeof WizardTopAppBarService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AppLogoAdministrationPluginBootstrap = AppLogoAdministrationPluginBootstrapDI;
