/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ESettingsValueType, INTERFACE_SETTINGS_GROUP, SettingsManagerService } from '@cloudbeaver/core-settings';
import type { ILocalizationSettingsSchema } from './SettingsLocalizationService.js';

export class LocalizationSettingsManagerServiceImpl extends Bootstrap {
  constructor(
    private readonly localizationService: LocalizationService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    super();
  }

  override register(): void {
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<ILocalizationSettingsSchema>(() => [
      {
        group: INTERFACE_SETTINGS_GROUP,
        key: 'core.localization.language',
        access: {
          scope: ['server', 'client'],
        },
        name: 'core_settings_localization_settings_locale_label',
        description: 'core_settings_localization_settings_locale_description',
        type: ESettingsValueType.Select,
        options: this.localizationService.supportedLanguages.map(language => ({
          value: language.isoCode,
          name: language.nativeName ?? language.name,
        })),
      },
    ]);
  }
}

export type LocalizationSettingsManagerService = LocalizationSettingsManagerServiceImpl;

export class LocalizationSettingsManagerServiceDI extends Context.Service<
  LocalizationSettingsManagerServiceDI,
  LocalizationSettingsManagerServiceImpl
>()('@cloudbeaver/core-settings-localization/LocalizationSettingsManagerService#LocalizationSettingsManagerService') {
  static readonly implementation = LocalizationSettingsManagerServiceImpl;

  static readonly dependencies = () => [LocalizationService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    LocalizationSettingsManagerServiceImpl,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeLocalizationSettingsManagerService() {
    const localizationService = yield* LocalizationService;
    const settingsManagerService = yield* SettingsManagerService;

    return new LocalizationSettingsManagerServiceImpl(localizationService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    LocalizationSettingsManagerServiceDI,
    never,
    Context.Service.Identifier<typeof LocalizationService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LocalizationSettingsManagerService = LocalizationSettingsManagerServiceDI;
