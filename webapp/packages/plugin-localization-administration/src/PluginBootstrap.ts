/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { WizardTopAppBarService } from '@cloudbeaver/plugin-administration';

const LanguageSelector = importLazyComponent(() => import('./LanguageSelector.js').then(module => module.LanguageSelector));

export class LocalizationAdministrationPluginBootstrapImpl extends Bootstrap {
  constructor(private readonly wizardTopAppBarService: WizardTopAppBarService) {
    super();
  }

  override register(): void {
    this.wizardTopAppBarService.placeholder.add(LanguageSelector, 4);
  }
}

export type LocalizationAdministrationPluginBootstrap = LocalizationAdministrationPluginBootstrapImpl;

export class LocalizationAdministrationPluginBootstrapDI extends Context.Service<
  LocalizationAdministrationPluginBootstrapDI,
  LocalizationAdministrationPluginBootstrapImpl
>()('@cloudbeaver/plugin-localization-administration/PluginBootstrap#LocalizationAdministrationPluginBootstrap') {
  static readonly implementation = LocalizationAdministrationPluginBootstrapImpl;

  static readonly dependencies = () => [WizardTopAppBarService] as const;
  static readonly make: Effect.Effect<
    LocalizationAdministrationPluginBootstrapImpl,
    never,
    Context.Service.Identifier<typeof WizardTopAppBarService>
  > = Effect.gen(function* makeLocalizationAdministrationPluginBootstrap() {
    const wizardTopAppBarService = yield* WizardTopAppBarService;

    return new LocalizationAdministrationPluginBootstrapImpl(wizardTopAppBarService);
  });
  static readonly layer: Layer.Layer<LocalizationAdministrationPluginBootstrapDI, never, Context.Service.Identifier<typeof WizardTopAppBarService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const LocalizationAdministrationPluginBootstrap = LocalizationAdministrationPluginBootstrapDI;
