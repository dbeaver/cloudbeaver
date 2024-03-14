/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { PRODUCT_SETTINGS_LAYER } from '@cloudbeaver/core-product';
import { createSettingsLayer, type ISettingsSource } from '@cloudbeaver/core-settings';
import { isNotNullDefined, parseJSONFlat } from '@cloudbeaver/core-utils';

import { EAdminPermission } from './EAdminPermission';
import { ServerConfigResource } from './ServerConfigResource';
import { SessionPermissionsResource } from './SessionPermissionsResource';

export const SERVER_SETTINGS_LAYER = createSettingsLayer(PRODUCT_SETTINGS_LAYER, 'server');

@injectable()
export class ServerSettingsService implements ISettingsSource {
  private readonly settings: Map<string, any>;
  private readonly changes: Map<string, any>;
  private lastConfig: any;

  constructor(
    readonly serverConfigResource: ServerConfigResource,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
  ) {
    this.lastConfig = null;
    this.settings = new Map();
    this.changes = new Map();
    this.serverConfigResource.onDataUpdate.addHandler(this.refreshConfig.bind(this));

    makeObservable<this, 'settings' | 'changes' | 'refreshConfig'>(this, {
      refreshConfig: action,
      changes: observable,
      settings: observable,
    });
  }

  has(key: any): boolean {
    return this.settings.has(key) || this.changes.has(key);
  }

  isEdited(key?: any): boolean {
    if (isNotNullDefined(key)) {
      return this.changes.has(key);
    }

    return this.changes.size > 0;
  }

  isReadOnly(key: any): boolean {
    return !this.sessionPermissionsResource.has(EAdminPermission.admin);
  }

  getEditedValue(key: any): any {
    if (this.changes.has(key)) {
      return this.changes.get(key);
    }

    return this.getValue(key);
  }

  getValue(key: any): any {
    return this.settings.get(key);
  }

  setValue(key: any, value: any): void {
    if (this.settings.get(key) === value) {
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
    await this.serverConfigResource.updateProductConfiguration(Object.fromEntries(this.changes));
  }

  resetChanges() {
    this.changes.clear();
  }

  private refreshConfig() {
    this.clear();

    if (!this.serverConfigResource.data) {
      this.lastConfig = null;
      return;
    }

    if (this.serverConfigResource.data.productConfiguration !== this.lastConfig) {
      this.lastConfig = this.serverConfigResource.data.productConfiguration;
      parseJSONFlat(this.serverConfigResource.data.productConfiguration, (key, value) => {
        this.settings.set(key, value);
      });
    }
  }
}
