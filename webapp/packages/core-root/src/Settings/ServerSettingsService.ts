/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { PRODUCT_SETTINGS_LAYER } from '@cloudbeaver/core-product';
import { createSettingsLayer, EditableSettingsSource, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schemaValidationError } from '@cloudbeaver/core-utils';

import { EAdminPermission } from '../EAdminPermission.js';
import { ServerConfigResource } from '../ServerConfigResource.js';
import { SessionPermissionsResource } from '../SessionPermissionsResource.js';

export const SERVER_SETTINGS_LAYER = createSettingsLayer(PRODUCT_SETTINGS_LAYER, 'server');

@injectable(() => [ServerConfigResource, SessionPermissionsResource, SettingsProviderService])
export class ServerSettingsService extends EditableSettingsSource {
  private readonly settings: Map<string, any>;
  private lastConfig: any;

  constructor(
    readonly serverConfigResource: ServerConfigResource,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly settingsProviderService: SettingsProviderService,
  ) {
    super();
    this.lastConfig = null;
    this.settings = new Map();
    this.serverConfigResource.onDataUpdate.addHandler(this.refreshConfig.bind(this));

    makeObservable<this, 'settings' | 'refreshConfig'>(this, {
      refreshConfig: action,
      settings: observable.shallow,
    });
  }

  override has(key: any): boolean {
    return this.settings.has(key) || super.has(key);
  }

  isOverrideDefaults(): boolean {
    return this.settings.size > 0;
  }

  isReadOnly(key: any): boolean {
    return !this.serverConfigResource.configurationMode && !this.sessionPermissionsResource.has(EAdminPermission.admin);
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  async save() {
    const error = this.validate();

    if (error) {
      throw new Error(error);
    }

    await this.serverConfigResource.updateProductConfiguration(this.getChanges());
  }

  getChanges(): Record<string, unknown> {
    return Object.fromEntries(this.changes);
  }

  validate(): string | null {
    for (const [key, value] of this.changes) {
      const settingSchema = this.settingsProviderService.schema.shape[key];

      if (value === null || !settingSchema) {
        continue;
      }

      const result = settingSchema.safeParse(value);

      if (!result.success) {
        return schemaValidationError(result.error, { prefix: key }).toString();
      }
    }

    return null;
  }

  protected getSnapshot() {
    return Object.fromEntries(this.settings);
  }

  restoreDefaults() {
    this.update(() => {
      this.clear();

      for (const key of this.settings.keys()) {
        this.resetValue(key);
      }
    });
  }

  private refreshConfig() {
    this.update(() => {
      if (!this.serverConfigResource.configurationMode) {
        this.clear();
      }

      if (!this.serverConfigResource.data) {
        this.settings.clear();
        this.lastConfig = null;

        return;
      }

      if (this.serverConfigResource.data.productConfiguration !== this.lastConfig) {
        this.settings.clear();
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
