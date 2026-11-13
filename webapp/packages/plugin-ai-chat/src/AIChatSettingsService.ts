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
  'plugin.ai-chat.disabled': schemaExtra.stringedBoolean().default(false),
});

export type AIChatSettingsSchema = typeof defaultSettings;
export type AIChatSettings = schema.infer<typeof defaultSettings>;

export class AIChatSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('plugin.ai-chat.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}

export type AIChatSettingsService = AIChatSettingsServiceImpl;

export class AIChatSettingsServiceDI extends Context.Service<AIChatSettingsServiceDI, AIChatSettingsServiceImpl>()(
  '@cloudbeaver/plugin-ai-chat/AIChatSettingsService#AIChatSettingsService',
) {
  static readonly implementation = AIChatSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService] as const;
  static readonly make: Effect.Effect<AIChatSettingsServiceImpl, never, Context.Service.Identifier<typeof SettingsProviderService>> = Effect.gen(
    function* makeAIChatSettingsService() {
      const settingsProviderService = yield* SettingsProviderService;

      return new AIChatSettingsServiceImpl(settingsProviderService);
    },
  );
  static readonly layer: Layer.Layer<AIChatSettingsServiceDI, never, Context.Service.Identifier<typeof SettingsProviderService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIChatSettingsService = AIChatSettingsServiceDI;
