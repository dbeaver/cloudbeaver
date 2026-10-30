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
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { StorageService } from '@cloudbeaver/core-storage';
import { getServerConfigurationFormPart, ServerConfigurationFormService, WizardTopAppBarService } from '@cloudbeaver/plugin-administration';
import { LanguageSelector } from '@cloudbeaver/plugin-localization';

@injectable(() => [
  WizardTopAppBarService,
  ServerConfigurationFormService,
  LocalizationService,
  ServerConfigResource,
  UserInfoResource,
  StorageService,
])
export class WizardLanguageSelectorBootstrap extends Bootstrap {
  private readonly pending = observable<{ userId: string; language: string }>({ userId: '', language: '' });
  private synchronizing = false;

  constructor(
    private readonly wizardTopAppBarService: WizardTopAppBarService,
    private readonly serverConfigurationFormService: ServerConfigurationFormService,
    private readonly localizationService: LocalizationService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly userInfoResource: UserInfoResource,
    storageService: StorageService,
  ) {
    super();
    this.synchronize = this.synchronize.bind(this);
    storageService.registerSettings('wizard_language', this.pending, () => ({ userId: '', language: '' }), undefined, this.synchronize);
  }

  override register(): void {
    this.wizardTopAppBarService.placeholder.add(LanguageSelector, 4);
    this.serverConfigurationFormService.onPrepare.addHandler(form => {
      if (this.serverConfigResource.configurationMode) {
        const { adminName } = getServerConfigurationFormPart(form).state.serverConfig;
        runInAction(() => {
          this.pending.userId = adminName?.trim().toLowerCase() ?? '';
          this.pending.language = this.localizationService.currentLanguage;
        });
      }
    });
    this.userInfoResource.onDataUpdate.addHandler(this.synchronize);
    this.serverConfigResource.onDataUpdate.addHandler(this.synchronize);
  }

  private async synchronize(): Promise<void> {
    if (
      this.synchronizing ||
      this.serverConfigResource.configurationMode ||
      !this.pending.userId ||
      !this.userInfoResource.hasAccess() ||
      (this.userInfoResource.isAuthenticated() && this.userInfoResource.getId() !== this.pending.userId)
    ) {
      return;
    }

    this.synchronizing = true;
    try {
      const anonymous = this.userInfoResource.isAnonymous();
      // A preference already saved in the profile takes precedence over a pending wizard choice.
      if (!this.userInfoResource.getConfigurationParameter('core.localization.language')) {
        await this.userInfoResource.updatePreferences({ 'core.localization.language': this.pending.language });
      }
      if (!anonymous) {
        runInAction(() => {
          this.pending.userId = '';
          this.pending.language = '';
        });
      }
    } catch (exception) {
      console.error('Failed to save wizard language preference', exception);
    } finally {
      this.synchronizing = false;
    }
  }
}
