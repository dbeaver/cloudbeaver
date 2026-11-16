/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ESettingsValueType, SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

import { TOOLS_PANEL_SETTINGS_GROUP } from './TOOLS_PANEL_SETTINGS_GROUP.js';

const settings = schema.object({
  'plugin.tools-panel.disabled': schemaExtra.stringedBoolean().default(false),
});

type Settings = typeof settings;

export class ToolsPanelSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.tools-panel.disabled');
  }

  readonly settings: SettingsProvider<Settings>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settings);

    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<Settings>(() => [
      {
        key: 'plugin.tools-panel.disabled',
        access: {
          scope: ['server', 'role'],
        },
        group: TOOLS_PANEL_SETTINGS_GROUP,
        type: ESettingsValueType.Checkbox,
        name: 'plugin_tools_panel_settings_disable_label',
        description: 'plugin_tools_panel_settings_disable_description',
      },
    ]);
  }
}

export type ToolsPanelSettingsService = ToolsPanelSettingsServiceImpl;

export class ToolsPanelSettingsServiceDI extends Context.Service<ToolsPanelSettingsServiceDI, ToolsPanelSettingsServiceImpl>()(
  '@cloudbeaver/plugin-tools-panel/ToolsPanelSettingsService#ToolsPanelSettingsService',
) {
  static readonly implementation = ToolsPanelSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    ToolsPanelSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeToolsPanelSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new ToolsPanelSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    ToolsPanelSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ToolsPanelSettingsService = ToolsPanelSettingsServiceDI;
