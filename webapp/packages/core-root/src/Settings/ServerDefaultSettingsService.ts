/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { SettingsSource } from '@cloudbeaver/core-settings';
import { getObjectPropertyDefaultValue } from '@cloudbeaver/core-sdk';
import { isNotNullDefined } from '@dbeaver/js-helpers';
import { ServerSettingsResource } from './ServerSettingsResource.js';

@injectable(() => [ServerSettingsResource])
export class ServerDefaultSettingsService extends SettingsSource {
  private readonly settings: Map<string, any>;

  constructor(private readonly serverSettingsResource: ServerSettingsResource) {
    super();
    this.settings = new Map();

    this.serverSettingsResource.onDataUpdate.addHandler(this.refreshDefaults.bind(this));

    makeObservable<this, 'settings' | 'refreshDefaults'>(this, {
      refreshDefaults: action,
      settings: observable.shallow,
    });
  }

  override has(key: string): boolean {
    return this.settings.has(key);
  }

  getValue(key: string): any {
    return this.settings.get(key);
  }

  protected getSnapshot(): any {
    return Object.fromEntries(this.settings);
  }

  private refreshDefaults() {
    this.update(() => {
      this.settings.clear();

      const settings = this.serverSettingsResource.data?.settings || [];

      for (const property of settings) {
        const key = property.id;

        if (!key) {
          continue;
        }

        const defaultValue = getObjectPropertyDefaultValue(property);

        if (isNotNullDefined(defaultValue)) {
          this.settings.set(key, defaultValue);
        }
      }
    });
  }
}
