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

const settings = schema.object({
  'plugin.connection-search.disabled': schemaExtra.stringedBoolean().default(false),
});

export class ConnectionSearchSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.connection-search.disabled');
  }
  readonly settings: SettingsProvider<typeof settings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof settings>(() => [
      {
        group: CONNECTIONS_SETTINGS_GROUP,
        key: 'plugin.connection-search.disabled',
        access: {
          scope: ['server', 'role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_connection_search_settings_disable',
        description: 'plugin_connection_search_settings_disable_description',
      },
    ]);
  }
}

export type ConnectionSearchSettingsService = ConnectionSearchSettingsServiceImpl;

export class ConnectionSearchSettingsServiceDI extends Context.Service<ConnectionSearchSettingsServiceDI, ConnectionSearchSettingsServiceImpl>()(
  '@cloudbeaver/plugin-connection-search/ConnectionSearchSettingsService#ConnectionSearchSettingsService',
) {
  static readonly implementation = ConnectionSearchSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    ConnectionSearchSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeConnectionSearchSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new ConnectionSearchSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    ConnectionSearchSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionSearchSettingsService = ConnectionSearchSettingsServiceDI;
