/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { CONNECTIONS_SETTINGS_GROUP } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.connections.hideConnectionViewForUsers': schemaExtra.stringedBoolean().default(false),
});

export type PluginConnectionsSettings = schema.infer<typeof defaultSettings>;

export class PluginConnectionsSettingsServiceImpl {
  get hideConnectionViewForUsers(): boolean {
    return this.settings.getValue('plugin.connections.hideConnectionViewForUsers');
  }
  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();
  }

  private registerSettings() {
    // todo: probably not working as a separate setting
    this.settingsManagerService.registerSettings<typeof defaultSettings>(() => [
      {
        key: 'plugin.connections.hideConnectionViewForUsers',
        type: ESettingsValueType.Checkbox,
        access: {
          scope: ['role'],
        },
        name: 'plugin_connections_settings_hide_connections_view_name',
        description: 'plugin_connections_settings_hide_connections_view_description',
        group: CONNECTIONS_SETTINGS_GROUP,
      },
    ]);
  }
}

export type PluginConnectionsSettingsService = PluginConnectionsSettingsServiceImpl;

export class PluginConnectionsSettingsServiceDI extends Context.Service<PluginConnectionsSettingsServiceDI, PluginConnectionsSettingsServiceImpl>()(
  '@cloudbeaver/plugin-connections/PluginConnectionsSettingsService#PluginConnectionsSettingsService',
) {
  static readonly implementation = PluginConnectionsSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    PluginConnectionsSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makePluginConnectionsSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new PluginConnectionsSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    PluginConnectionsSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const PluginConnectionsSettingsService = PluginConnectionsSettingsServiceDI;
