/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ESettingsValueType, INTERFACE_SETTINGS_GROUP, SettingsManagerService } from '@cloudbeaver/core-settings';

import { ThemeService } from './ThemeService.js';
import type { IThemeSettingsSchema } from './ThemeSettingsService.js';

export class ThemeSettingsManagementServiceImpl {
  constructor(themeService: ThemeService, settingsManagerService: SettingsManagerService) {
    settingsManagerService.registerSettings<IThemeSettingsSchema>(() => [
      {
        key: 'core.theming.theme',
        access: {
          scope: ['server', 'client'],
        },
        type: ESettingsValueType.Select,
        name: 'core_theming_settings_theme_name',
        description: 'core_theming_settings_theme_description',
        options: themeService.themes.map(theme => ({ value: theme.id, name: theme.name })),
        group: INTERFACE_SETTINGS_GROUP,
      },
    ]);
  }
}

export type ThemeSettingsManagementService = ThemeSettingsManagementServiceImpl;

export class ThemeSettingsManagementServiceDI extends Context.Service<ThemeSettingsManagementServiceDI, ThemeSettingsManagementServiceImpl>()(
  '@cloudbeaver/core-theming/ThemeSettingsManagementService#ThemeSettingsManagementService',
) {
  static readonly implementation = ThemeSettingsManagementServiceImpl;

  static readonly dependencies = () => [ThemeService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    ThemeSettingsManagementServiceImpl,
    never,
    Context.Service.Identifier<typeof ThemeService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeThemeSettingsManagementService() {
    const themeService = yield* ThemeService;
    const settingsManagerService = yield* SettingsManagerService;

    return new ThemeSettingsManagementServiceImpl(themeService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    ThemeSettingsManagementServiceDI,
    never,
    Context.Service.Identifier<typeof ThemeService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ThemeSettingsManagementService = ThemeSettingsManagementServiceDI;
