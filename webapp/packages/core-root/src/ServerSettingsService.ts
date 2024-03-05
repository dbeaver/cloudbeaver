/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { type ISettingsSource, SettingsResolverService } from '@cloudbeaver/core-settings';
import { parseJSONFlat, setByPath } from '@cloudbeaver/core-utils';

import { EAdminPermission } from './EAdminPermission';
import { ServerConfigResource } from './ServerConfigResource';
import { SessionPermissionsResource } from './SessionPermissionsResource';

@injectable()
export class ServerSettingsService extends Dependency implements ISettingsSource {
  private readonly settings: Map<string, any>;
  private readonly changes: Map<string, any>;
  private lastConfig: any;

  get isChanged(): boolean {
    return this.changes.size > 0;
  }

  constructor(
    readonly serverConfigResource: ServerConfigResource,
    private readonly sessionPermissionsResource: SessionPermissionsResource,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
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
    return this.settingsResolverService.has(key) || this.settings.has(key) || this.changes.has(key);
  }

  isReadOnly(key: any): boolean {
    return this.settingsResolverService.has(key) || !this.sessionPermissionsResource.has(EAdminPermission.admin);
  }

  getDefaultValue(key: any): any {
    return this.settingsResolverService.getDefaultValue(key) ?? this.settings.get(key);
  }

  getValue(key: any): any {
    if (this.settingsResolverService.has(key)) {
      return this.settingsResolverService.getValue(key);
    }

    if (this.changes.has(key)) {
      return this.changes.get(key);
    }

    return this.settings.get(key);
  }

  setValue(key: any, value: any): void {
    if (this.settingsResolverService.has(key)) {
      throw new Error(`Can't set value for key ${key}`);
    }

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
    const changes: Record<string, any> = {};

    for (const [key, value] of this.changes) {
      changes[key] = value;
    }

    await this.serverConfigResource.updateProductConfiguration(changes);
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
