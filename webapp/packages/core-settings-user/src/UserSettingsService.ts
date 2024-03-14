/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, runInAction } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import type { ISettingsSource } from '@cloudbeaver/core-settings';
import { StorageService } from '@cloudbeaver/core-storage';
import { isNotNullDefined, parseJSONFlat } from '@cloudbeaver/core-utils';

@injectable()
export class UserSettingsService implements ISettingsSource {
  private readonly settings: Map<string, any>;
  private readonly changes: Map<string, any>;
  private lastConfig: any;
  private localSettings: Map<string, any>;

  constructor(
    private readonly userInfoResource: UserInfoResource,
    private readonly storageService: StorageService,
  ) {
    this.lastConfig = null;
    this.settings = new Map();
    this.changes = new Map();
    this.localSettings = new Map();

    this.userInfoResource.onDataUpdate.addHandler(this.refreshConfig.bind(this));
    this.userInfoResource.onUserChange.addHandler(this.refreshConfig.bind(this));

    makeObservable<this, 'settings' | 'changes' | 'refreshConfig' | 'localSettings'>(this, {
      refreshConfig: action,
      changes: observable.shallow,
      settings: observable,
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
    return this.getSource().has(key) || this.changes.has(key);
  }

  isEdited(key?: any): boolean {
    if (isNotNullDefined(key)) {
      return this.changes.has(key);
    }

    return this.changes.size > 0;
  }

  isReadOnly(key: any): boolean {
    return false;
  }

  getEditedValue(key: any): any {
    if (this.changes.has(key)) {
      return this.changes.get(key);
    }

    return this.getValue(key);
  }

  getValue(key: any): any {
    return this.getSource().get(key);
  }

  setValue(key: any, value: any): void {
    if (this.getSource().get(key) === value) {
      this.changes.delete(key);
    } else {
      this.changes.set(key, value);
    }
  }

  clear(): void {
    this.settings.clear();
    this.changes.clear();
  }

  async save() {
    if (this.userInfoResource.data) {
      await this.userInfoResource.updatePreferences(Object.fromEntries(this.changes));
    } else {
      runInAction(() => {
        this.changes.forEach((value, key) => {
          this.localSettings.set(key, value);
        });
        this.changes.clear();
      });
    }
  }

  resetChanges() {
    this.changes.clear();
  }

  private refreshConfig() {
    if (!this.userInfoResource.data) {
      this.clear();
      this.lastConfig = null;
      return;
    }

    if (this.userInfoResource.data.configurationParameters !== this.lastConfig) {
      this.clear();
      this.localSettings.clear();
      this.lastConfig = this.userInfoResource.data.configurationParameters;
      parseJSONFlat(this.userInfoResource.data.configurationParameters, (key, value) => {
        this.settings.set(key, value);
        this.localSettings.set(key, value);
      });
    }
  }

  private getSource() {
    if (this.userInfoResource.data) {
      return this.settings;
    }

    return this.localSettings;
  }
}
