/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { SessionResource } from '@cloudbeaver/core-root';
import type { ISettingChangeData } from '@cloudbeaver/core-settings';
import { SettingsLocalizationService, type ILocalizationSettings } from '@cloudbeaver/core-settings-localization';

export class SessionLocalizationBootstrapImpl extends Bootstrap {
  constructor(
    private readonly sessionResource: SessionResource,
    private readonly localizationService: LocalizationService,
    private readonly settingsLocalizationService: SettingsLocalizationService,
  ) {
    super();
    this.syncSessionLanguage = this.syncSessionLanguage.bind(this);
    this.syncSessionLanguageWithSettings = this.syncSessionLanguageWithSettings.bind(this);
  }

  override register(): void | Promise<void> {
    this.sessionResource.onDataUpdate.addHandler(this.syncSessionLanguage.bind(this));
    this.settingsLocalizationService.settingsProvider.onChange.addHandler(this.syncSessionLanguageWithSettings);
  }

  protected override dispose(): Promise<void> | void {
    this.sessionResource.onDataUpdate.removeHandler(this.syncSessionLanguage.bind(this));
    this.settingsLocalizationService.settingsProvider.onChange.removeHandler(this.syncSessionLanguageWithSettings);
  }

  private syncSessionLanguageWithSettings(data: ISettingChangeData<keyof ILocalizationSettings>) {
    if (data.key === 'core.localization.language') {
      this.sessionResource.changeLanguage(data.value).catch(exception => {
        console.error(exception);
      });
    }
  }

  private syncSessionLanguage() {
    const session = this.sessionResource.data;

    if (session && session.locale !== this.localizationService.currentLanguage) {
      this.sessionResource.changeLanguage(this.localizationService.currentLanguage).catch(exception => {
        console.error(exception);
      });
    }
  }
}

export type SessionLocalizationBootstrap = SessionLocalizationBootstrapImpl;

export class SessionLocalizationBootstrapDI extends Context.Service<SessionLocalizationBootstrapDI, SessionLocalizationBootstrapImpl>()(
  '@cloudbeaver/core-session-localization/SessionLocalizationBootstrap#SessionLocalizationBootstrap',
) {
  static readonly implementation = SessionLocalizationBootstrapImpl;

  static readonly dependencies = () => [SessionResource, LocalizationService, SettingsLocalizationService] as const;
  static readonly make: Effect.Effect<
    SessionLocalizationBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof SessionResource>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof SettingsLocalizationService>
  > = Effect.gen(function* makeSessionLocalizationBootstrap() {
    const sessionResource = yield* SessionResource;
    const localizationService = yield* LocalizationService;
    const settingsLocalizationService = yield* SettingsLocalizationService;

    return new SessionLocalizationBootstrapImpl(sessionResource, localizationService, settingsLocalizationService);
  });
  static readonly layer: Layer.Layer<
    SessionLocalizationBootstrapDI,
    never,
    | Context.Service.Identifier<typeof SessionResource>
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof SettingsLocalizationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionLocalizationBootstrap = SessionLocalizationBootstrapDI;
