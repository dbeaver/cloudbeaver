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
  'plugin.connection-custom.disabled': schemaExtra.stringedBoolean().default(false),
});

export class CustomConnectionSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.connection-custom.disabled');
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
        key: 'plugin.connection-custom.disabled',
        access: {
          scope: ['role'],
        },
        group: CONNECTIONS_SETTINGS_GROUP,
        name: 'plugin_connection_custom_settings_disabled_name',
        type: ESettingsValueType.Checkbox,
      },
    ]);
  }
}

export type CustomConnectionSettingsService = CustomConnectionSettingsServiceImpl;

export class CustomConnectionSettingsServiceDI extends Context.Service<CustomConnectionSettingsServiceDI, CustomConnectionSettingsServiceImpl>()(
  '@cloudbeaver/plugin-connection-custom/CustomConnectionSettingsService#CustomConnectionSettingsService',
) {
  static readonly implementation = CustomConnectionSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    CustomConnectionSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeCustomConnectionSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new CustomConnectionSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    CustomConnectionSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const CustomConnectionSettingsService = CustomConnectionSettingsServiceDI;
