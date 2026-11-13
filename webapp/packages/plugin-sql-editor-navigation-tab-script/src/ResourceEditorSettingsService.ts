/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const defaultSettings = schema.object({
  'plugin.sql-editor-navigation-tab-resource': schema.object({}),
});

export type ResourceEditorSettings = typeof defaultSettings;

export class ResourceEditorSettingsServiceImpl {
  readonly settings: SettingsProvider<ResourceEditorSettings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<ResourceEditorSettings>(() => []);
  }
}

export type ResourceEditorSettingsService = ResourceEditorSettingsServiceImpl;

export class ResourceEditorSettingsServiceDI extends Context.Service<ResourceEditorSettingsServiceDI, ResourceEditorSettingsServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor-navigation-tab-script/ResourceEditorSettingsService#ResourceEditorSettingsService',
) {
  static readonly implementation = ResourceEditorSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    ResourceEditorSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeResourceEditorSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new ResourceEditorSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    ResourceEditorSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ResourceEditorSettingsService = ResourceEditorSettingsServiceDI;
