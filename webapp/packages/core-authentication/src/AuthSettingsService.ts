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
  'core.authentication.disableAnonymousAccess': schemaExtra.stringedBoolean().default(false),
});

export type AuthSettings = schema.infer<typeof settingsSchema>;

export class AuthSettingsServiceImpl {
  get disableAnonymousAccess(): boolean {
    return this.settings.getValue('core.authentication.disableAnonymousAccess');
  }
  readonly settings: SettingsProvider<typeof settingsSchema>;

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
      //   key: 'core.authentication.disableAnonymousAccess',
      //   access: {
      //     scope: ['server'],
      //   },
      //   type: ESettingsValueType.Checkbox,
      //   name: 'settings_authentication_disable_anonymous_access_name',
      //   description: 'settings_authentication_disable_anonymous_access_description',
      //   group: AUTH_SETTINGS_GROUP,
      // },
    ]);
  }
}

export type AuthSettingsService = AuthSettingsServiceImpl;

export class AuthSettingsServiceDI extends Context.Service<AuthSettingsServiceDI, AuthSettingsServiceImpl>()(
  '@cloudbeaver/core-authentication/AuthSettingsService#AuthSettingsService',
) {
  static readonly implementation = AuthSettingsServiceImpl;

  static readonly dependencies = () => [SettingsProviderService, SettingsManagerService] as const;
  static readonly make: Effect.Effect<
    AuthSettingsServiceImpl,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Effect.gen(function* makeAuthSettingsService() {
    const settingsProviderService = yield* SettingsProviderService;
    const settingsManagerService = yield* SettingsManagerService;

    return new AuthSettingsServiceImpl(settingsProviderService, settingsManagerService);
  });
  static readonly layer: Layer.Layer<
    AuthSettingsServiceDI,
    never,
    Context.Service.Identifier<typeof SettingsProviderService> | Context.Service.Identifier<typeof SettingsManagerService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AuthSettingsService = AuthSettingsServiceDI;
