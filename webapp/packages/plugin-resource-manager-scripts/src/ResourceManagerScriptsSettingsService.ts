/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { RESOURCE_MANAGER_SETTINGS_GROUP } from '@cloudbeaver/core-resource-manager';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'plugin.resource-manager-scripts.disabled': schemaExtra.stringedBoolean().default(false),
});

type Settings = typeof settingsSchema;

export class ResourceManagerScriptsSettingsServiceImpl {
  readonly settings: SettingsProvider<Settings>;

  get disabled(): boolean {
    return this.settings.getValue('plugin.resource-manager-scripts.disabled');
  }

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<Settings>(() => [
      {
        group: RESOURCE_MANAGER_SETTINGS_GROUP,
        key: 'plugin.resource-manager-scripts.disabled',
        access: {
          scope: ['role'],
        },
        type: ESettingsValueType.Checkbox,
        name: 'plugin_resource_manager_scripts_disable',
        description: 'plugin_resource_manager_scripts_disable_description',
      },
    ]);
  }
}

export type ResourceManagerScriptsSettingsService = ResourceManagerScriptsSettingsServiceImpl;

export class ResourceManagerScriptsSettingsServiceDI extends Context.Service<
  ResourceManagerScriptsSettingsServiceDI,
  ResourceManagerScriptsSettingsServiceImpl
>()('@cloudbeaver/plugin-resource-manager-scripts/ResourceManagerScriptsSettingsService#ResourceManagerScriptsSettingsService') {
  static readonly implementation = ResourceManagerScriptsSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    ResourceManagerScriptsSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeResourceManagerScriptsSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new ResourceManagerScriptsSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    ResourceManagerScriptsSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResourceManagerScriptsSettingsService = ResourceManagerScriptsSettingsServiceDI;
