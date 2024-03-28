/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { SettingsSource } from '@cloudbeaver/core-settings';
import { StorageService } from '@cloudbeaver/core-storage';

@injectable()
export class UserSettingsService extends SettingsSource {
  private readonly settings: Map<string, any>;
  private lastConfig: any;
  private localSettings: Map<string, any>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly storageService: StorageService,
  ) {
    super();
    this.lastConfig = null;
    this.settings = new Map();
    this.localSettings = new Map();

    this.userInfoResource.onDataUpdate.addHandler(this.refreshConfig.bind(this));
    this.userInfoResource.onUserChange.addHandler(this.refreshConfig.bind(this));

    makeObservable<this, 'settings' | 'localSettings'>(this, {
      settings: observable.shallow,
      localSettings: observable,
    });

    this.storageService.registerSettings(
      'user_settings',
      this.localSettings,
      () => new Map(),
      undefined,
      () => this.refreshConfig(),
    );
  }

  has(key: any): boolean {
    return this.getSource().has(key) || super.has(key);
  }

  isReadOnly(key: any): boolean {
    return false;
  }

  getValue(key: any): any {
    return this.getSource().get(key);
  }

  clear(): void {
    this.update(() => {
      super.clear();
      this.settings.clear();
    });
  }

  async save() {
    if (this.userInfoResource.data) {
      await this.userInfoResource.updatePreferences(Object.fromEntries(this.changes));
    } else {
      this.update(() => {
        this.changes.forEach((value, key) => {
          this.localSettings.set(key, value);
        });
        this.changes.clear();
      });
    }
  }

  resetChanges() {
    super.clear();
  }

  protected getSnapshot() {
    return Object.fromEntries(this.getSource());
  }

  private refreshConfig() {
    this.update(() => {
      if (!this.userInfoResource.data) {
        this.clear();
        this.lastConfig = null;
        return;
      }

      if (this.userInfoResource.data.configurationParameters !== this.lastConfig) {
        this.clear();
        this.localSettings.clear();
        this.lastConfig = this.userInfoResource.data.configurationParameters;

        if (this.lastConfig && typeof this.lastConfig === 'object') {
          for (const [key, value] of Object.entries(this.lastConfig)) {
            this.settings.set(key, value);
            this.localSettings.set(key, value);
          }
        }
      }
    });
  }

  private getSource() {
    if (this.userInfoResource.data) {
      return this.settings;
    }

    return this.localSettings;
  }
}
