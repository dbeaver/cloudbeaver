/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { SettingsManagerService, SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema, schemaExtra } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'core.browser.cookies.disabled': schemaExtra.stringedBoolean().default(false),
});

export type BrowserSettingsSchema = typeof settingsSchema;
export type CookiesSettings = schema.infer<BrowserSettingsSchema>;

export class BrowserSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('core.browser.cookies.disabled');
  }
  readonly settings: SettingsProvider<BrowserSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsManagerService: SettingsManagerService,
  ) {
    this.settings = this.settingsProviderService.createSettings(settingsSchema);
    this.registerSettings();
  }

  private registerSettings() {
    this.settingsManagerService.registerSettings<typeof settingsSchema>(() => [
      // {
      //   group: BROWSER_COOKIES_SETTINGS_GROUP,
      //   key: 'cookies.disabled',
      //   name: 'Disable',
      //   type: ESettingsValueType.Checkbox,
      // },
    ]);
  }
}

export type BrowserSettingsService = BrowserSettingsServiceImpl;

export class BrowserSettingsServiceDI extends Context.Service<BrowserSettingsServiceDI, BrowserSettingsServiceImpl>()(
  '@cloudbeaver/core-browser-settings/BrowserSettingsService#BrowserSettingsService',
) {
  static readonly implementation = BrowserSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    BrowserSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeBrowserSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new BrowserSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    BrowserSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const BrowserSettingsService = BrowserSettingsServiceDI;
