/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { StorageService } from '@cloudbeaver/core-storage';
import { AuthenticationService, type AuthEventType } from '@cloudbeaver/plugin-authentication';

const LANGUAGE_SETTING = 'core.localization.language';

@injectable(() => [LocalizationService, UserInfoResource, ServerConfigResource, StorageService, AuthenticationService])
export class PendingLanguageBootstrap extends Bootstrap {
  private readonly pending = observable({ language: '', login: false });
  private readonly beforeChange = new Executor<string>();
  private synchronizing = false;

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly userInfoResource: UserInfoResource,
    private readonly serverConfigResource: ServerConfigResource,
    storageService: StorageService,
    private readonly authenticationService: AuthenticationService,
  ) {
    super();
    this.synchronize = this.synchronize.bind(this);
    this.handleLogin = this.handleLogin.bind(this);
    storageService.registerSettings('pending_language', this.pending, () => ({ language: '', login: false }), undefined, this.synchronize);

    this.beforeChange.addHandler((language, context) => {
      if (this.serverConfigResource.configurationMode || !this.userInfoResource.hasAccess()) {
        runInAction(() => {
          this.pending.language = language;
          this.pending.login = false;
        });

        // The UI has already changed. Defer preference persistence until a session is available.
        ExecutorInterrupter.interrupt(context);
      }
    });
  }

  override register(): void {
    this.localizationService.onChange.before(this.beforeChange);
    this.userInfoResource.onDataUpdate.addHandler(this.synchronize);
    this.serverConfigResource.onDataUpdate.addHandler(this.synchronize);
    this.authenticationService.onLogin.addHandler(this.handleLogin);
  }

  override async load(): Promise<void> {
    await this.synchronize();
  }

  override dispose(): void {
    this.localizationService.onChange.removeBefore(this.beforeChange);
    this.userInfoResource.onDataUpdate.removeHandler(this.synchronize);
    this.serverConfigResource.onDataUpdate.removeHandler(this.synchronize);
    this.authenticationService.onLogin.removeHandler(this.handleLogin);
  }

  private async handleLogin(event: AuthEventType): Promise<void> {
    if (event === 'before' && this.userInfoResource.isAnonymous()) {
      // Capture the current preference at the login boundary, including full-page SSO redirects.
      runInAction(() => {
        this.pending.language = this.userInfoResource.getConfigurationParameter(LANGUAGE_SETTING) ?? '';
        this.pending.login = true;
      });
    } else if (event === 'after') {
      await this.synchronize();
    }
  }

  private async synchronize(): Promise<void> {
    if (this.serverConfigResource.configurationMode || !this.userInfoResource.hasAccess()) {
      if (this.pending.language) {
        this.localizationService.setLanguage(this.pending.language);
      }

      return;
    }

    const anonymous = this.userInfoResource.isAnonymous();
    const preference: string | undefined = this.userInfoResource.getConfigurationParameter(LANGUAGE_SETTING);

    if (this.pending.login && anonymous) {
      // Login may be cancelled, or the anonymous session may change before the next attempt.
      runInAction(() => {
        this.pending.language = preference ?? '';
      });

      return;
    }

    const language = this.pending.language;

    if (!language || this.synchronizing) {
      return;
    }

    this.synchronizing = true;

    try {
      // Existing profile preferences take precedence over a pre-login choice.
      if (!preference) {
        this.localizationService.setLanguage(language);
        await this.userInfoResource.updatePreferences({ [LANGUAGE_SETTING]: language });
      }

      runInAction(() => {
        if (this.pending.language === language) {
          this.pending.language = '';
          this.pending.login = false;
        }
      });
    } catch (exception) {
      console.error('Failed to save language preference', exception);
    } finally {
      this.synchronizing = false;
    }
  }
}
