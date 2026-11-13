/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

import type { ISettingChangeData } from '@cloudbeaver/core-settings';
import { SettingsLocalizationService, type ILocalizationSettings } from './SettingsLocalizationService.js';

export class SettingsLocalizationBootstrapImpl extends Bootstrap {
  constructor(
    private readonly settingsLocalizationService: SettingsLocalizationService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.changeLanguage = this.changeLanguage.bind(this);
    this.syncLanguage = this.syncLanguage.bind(this);
  }

  override register(): void {
    this.localizationService.onChange.addHandler(this.changeLanguage);
    this.settingsLocalizationService.settingsProvider.onChange.addHandler(this.syncLanguage);
  }

  override dispose(): void {
    this.localizationService.onChange.removeHandler(this.changeLanguage);
    this.settingsLocalizationService.settingsProvider.onChange.removeHandler(this.syncLanguage);
  }

  private syncLanguage(data: ISettingChangeData<keyof ILocalizationSettings>) {
    if (data.key === 'core.localization.language') {
      this.localizationService.setLanguage(data.value);
    }
  }

  private async changeLanguage(language: string) {
    await this.settingsLocalizationService.changeLanguage(language);
  }
}

export type SettingsLocalizationBootstrap = SettingsLocalizationBootstrapImpl;

export class SettingsLocalizationBootstrapDI extends Context.Service<SettingsLocalizationBootstrapDI, SettingsLocalizationBootstrapImpl>()(
  '@cloudbeaver/core-settings-localization/SettingsLocalizationBootstrap#SettingsLocalizationBootstrap',
) {
  static readonly implementation = SettingsLocalizationBootstrapImpl;

  static readonly dependencies = () => [SettingsLocalizationService, LocalizationService] as const;
  static readonly make: Effect.Effect<
    SettingsLocalizationBootstrapImpl,
    never,
    Context.Service.Identifier<typeof SettingsLocalizationService> | Context.Service.Identifier<typeof LocalizationService>
  > = Effect.gen(function* makeSettingsLocalizationBootstrap() {
    const settingsLocalizationService = yield* SettingsLocalizationService;
    const localizationService = yield* LocalizationService;

    return new SettingsLocalizationBootstrapImpl(settingsLocalizationService, localizationService);
  });
  static readonly layer: Layer.Layer<
    SettingsLocalizationBootstrapDI,
    never,
    Context.Service.Identifier<typeof SettingsLocalizationService> | Context.Service.Identifier<typeof LocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SettingsLocalizationBootstrap = SettingsLocalizationBootstrapDI;
