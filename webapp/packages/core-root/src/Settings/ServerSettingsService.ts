/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { PRODUCT_SETTINGS_LAYER } from '@cloudbeaver/core-product';
import { createSettingsLayer, SettingsSource } from '@cloudbeaver/core-settings';

import { EAdminPermission } from '../EAdminPermission.js';
import { ServerConfigResource } from '../ServerConfigResource.js';
import { SessionPermissionsResource } from '../SessionPermissionsResource.js';

export const SERVER_SETTINGS_LAYER = createSettingsLayer(PRODUCT_SETTINGS_LAYER, 'server');

@injectable()
export class ServerSettingsService extends SettingsSource {
  private readonly settings: Map<string, any>;
  private lastConfig: any;

  constructor(
    readonly serverConfigResource: ServerConfigResource,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    super();
    this.lastConfig = null;
    this.settings = new Map();
    this.serverConfigResource.onDataUpdate.addHandler(this.refreshConfig.bind(this));

    makeObservable<this, 'settings' | 'refreshConfig'>(this, {
      refreshConfig: action,
      settings: observable.shallow,
      clear: action,
    });
  }

  override has(key: any): boolean {
    return this.settings.has(key) || super.has(key);
  }

  isOverrideDefaults(): boolean {
    return this.settings.size > 0;
  }

  isReadOnly(key: any): boolean {
    return !this.sessionPermissionsResource.has(EAdminPermission.admin);
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  async save() {
    await this.serverConfigResource.updateProductConfiguration(Object.fromEntries(this.changes));
  }

  protected getSnapshot() {
    return Object.fromEntries(this.settings);
  }

  restoreDefaults() {
    this.update(() => {
      this.clear();
      for (const key of this.settings.keys()) {
        this.setValue(key, null);
      }
    });
  }

  private refreshConfig() {
    this.update(() => {
      this.clear();
      this.settings.clear();

      if (!this.serverConfigResource.data) {
        this.lastConfig = null;
        return;
      }

      if (this.serverConfigResource.data.productConfiguration !== this.lastConfig) {
        this.lastConfig = this.serverConfigResource.data.productConfiguration;
        if (this.lastConfig && typeof this.lastConfig === 'object') {
          for (const [key, value] of Object.entries(this.lastConfig)) {
            this.settings.set(key, value);
          }
        }
      }
    });
  }
}
