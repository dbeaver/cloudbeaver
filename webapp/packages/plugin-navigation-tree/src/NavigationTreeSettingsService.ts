/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NAVIGATION_TREE_SETTINGS_GROUP } from '@cloudbeaver/core-navigation-tree';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.navigation-tree.disabled': schemaExtra.stringedBoolean().default(false),
});

export type NavigationTreeSettings = schema.infer<typeof defaultSettings>;

export class NavigationTreeSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.navigation-tree.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();

    makeObservable(this, {
      disabled: computed,
    });
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => [
      {
        group: NAVIGATION_TREE_SETTINGS_GROUP,
        key: 'plugin.navigation-tree.disabled',
        access: {
          scope: ['role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_navigation_tree_settings_disable',
        description: 'plugin_navigation_tree_settings_disable_description',
      },
    ]);
  }
}

export type NavigationTreeSettingsService = NavigationTreeSettingsServiceImpl;

export class NavigationTreeSettingsServiceDI extends Context.Service<NavigationTreeSettingsServiceDI, NavigationTreeSettingsServiceImpl>()(
  '@cloudbeaver/plugin-navigation-tree/NavigationTreeSettingsService#NavigationTreeSettingsService',
) {
  static readonly implementation = NavigationTreeSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    NavigationTreeSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeNavigationTreeSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new NavigationTreeSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    NavigationTreeSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavigationTreeSettingsService = NavigationTreeSettingsServiceDI;
