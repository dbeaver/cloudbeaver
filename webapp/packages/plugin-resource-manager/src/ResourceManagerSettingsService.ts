/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.resource-manager.disabled': schemaExtra.stringedBoolean().default(false), //! use resourceManagerEnabled in server config instead
});

export type ResourceManagerSettingsSchema = typeof defaultSettings;
export type ResourceManagerSettings = schema.infer<ResourceManagerSettingsSchema>;

export class ResourceManagerSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.resource-manager.disabled');
  }
  readonly settings: SettingsProvider<ResourceManagerSettingsSchema>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}

export type ResourceManagerSettingsService = ResourceManagerSettingsServiceImpl;

export class ResourceManagerSettingsServiceDI extends Context.Service<ResourceManagerSettingsServiceDI, ResourceManagerSettingsServiceImpl>()(
  '@cloudbeaver/plugin-resource-manager/ResourceManagerSettingsService#ResourceManagerSettingsService',
) {
  static readonly implementation = ResourceManagerSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService] as const;
  static readonly make: Effect.Effect<ResourceManagerSettingsServiceImpl, never, Context.Service.Identifier<typeof SettingsProviderService>> =
    Effect.gen(function* makeResourceManagerSettingsService() {
      const settingsProviderService = yield* SettingsProviderService;

      return new ResourceManagerSettingsServiceImpl(settingsProviderService);
    });
  static readonly layer: Layer.Layer<ResourceManagerSettingsServiceDI, never, Context.Service.Identifier<typeof SettingsProviderService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const ResourceManagerSettingsService = ResourceManagerSettingsServiceDI;
