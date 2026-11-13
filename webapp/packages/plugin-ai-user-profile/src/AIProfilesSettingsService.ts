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
  'ai-profiles.disabled': schemaExtra.stringedBoolean().default(false),
});

export class AIProfilesSettingsServiceImpl {
  get disabled(): boolean {
    return this.settings.getValue('ai-profiles.disabled');
  }

  readonly settings: SettingsProvider<typeof defaultSettings>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settings = this.settingsProviderService.createSettings(defaultSettings);
  }
}

export type AIProfilesSettingsService = AIProfilesSettingsServiceImpl;

export class AIProfilesSettingsServiceDI extends Context.Service<AIProfilesSettingsServiceDI, AIProfilesSettingsServiceImpl>()(
  '@cloudbeaver/plugin-ai-user-profile/AIProfilesSettingsService#AIProfilesSettingsService',
) {
  static readonly implementation = AIProfilesSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService] as const;
  static readonly make: Effect.Effect<AIProfilesSettingsServiceImpl, never, Context.Service.Identifier<typeof SettingsProviderService>> = Effect.gen(
    function* makeAIProfilesSettingsService() {
      const settingsProviderService = yield* SettingsProviderService;

      return new AIProfilesSettingsServiceImpl(settingsProviderService);
    },
  );
  static readonly layer: Layer.Layer<AIProfilesSettingsServiceDI, never, Context.Service.Identifier<typeof SettingsProviderService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AIProfilesSettingsService = AIProfilesSettingsServiceDI;
