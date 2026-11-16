/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import {
  ESettingsValueType,
  INTERFACE_SETTINGS_GROUP,
  SettingsManagerService,
  SettingsProvider,
  SettingsProviderService,
} from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settings = schema.object({
  'plugin.navigation-tabs.multipleRows': schemaExtra.stringedBoolean().default(false),
});

type Settings = typeof settings;

export class NavigationTabsSettingsServiceImpl {
  readonly settings: SettingsProvider<Settings>;

  get hasMultipleRows(): boolean {
    return this.settings.getValue('plugin.navigation-tabs.multipleRows');
  }

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settings);
  }

  registerSettingsUI() {
    this.settingsManagerService.registerSettings<Settings>(() => [
      {
        group: INTERFACE_SETTINGS_GROUP,
        key: 'plugin.navigation-tabs.multipleRows',
        access: {
          scope: ['client'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_navigation_tabs_multiple_rows',
        description: 'plugin_navigation_tabs_multiple_rows_description',
      },
    ]);
  }
}

export type NavigationTabsSettingsService = NavigationTabsSettingsServiceImpl;

export class NavigationTabsSettingsServiceDI extends Context.Service<NavigationTabsSettingsServiceDI, NavigationTabsSettingsServiceImpl>()(
  '@cloudbeaver/plugin-navigation-tabs/NavigationTabs/NavigationTabsSettingsService#NavigationTabsSettingsService',
) {
  static readonly implementation = NavigationTabsSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    NavigationTabsSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeNavigationTabsSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new NavigationTabsSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    NavigationTabsSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavigationTabsSettingsService = NavigationTabsSettingsServiceDI;
