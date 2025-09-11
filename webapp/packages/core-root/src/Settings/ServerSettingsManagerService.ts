/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { type ISettingDescription, ROOT_SETTINGS_GROUP, type SettingsDescriptionGetter, type SettingsGroup } from '@cloudbeaver/core-settings';
import { getPathParent, type ILoadableState } from '@cloudbeaver/core-utils';

import { ServerSettingsResource } from './ServerSettingsResource.js';
import { SettingsTransformationService } from './SettingsTransformationService.js';

@injectable(() => [SettingsTransformationService, ServerSettingsResource])
export class ServerSettingsManagerService {
  readonly loaders: ReadonlyArray<ILoadableState>;

  get providedSettings(): Set<string> {
    return new Set(this.settings.map(setting => setting.key as string));
  }

  private get settings(): ReadonlyArray<ISettingDescription<any>> {
    return (this.serverSettingsResource.data?.settings || [])
      .map(this.settingsTransformationService.mapSetting.bind(this.settingsTransformationService, this.serverGroups))
      .filter(Boolean) as ISettingDescription<any>[];
  }

  private serverGroups: Map<string, SettingsGroup>;

  constructor(
    private readonly settingsTransformationService: SettingsTransformationService,
    private readonly serverSettingsResource: ServerSettingsResource,
  ) {
    this.serverGroups = new Map();
    this.loaders = [getCachedDataResourceLoaderState(this.serverSettingsResource, () => undefined)];

    serverSettingsResource.onDataUpdate.addHandler(this.loadSettings.bind(this));
    makeObservable<this, 'settings' | 'providedSettings' | 'serverGroups' | 'loadSettings'>(this, {
      settings: computed,
      providedSettings: computed,
      serverGroups: observable.shallow,
      loadSettings: action,
    });
  }

  getSettingsGetter<T>(): SettingsDescriptionGetter<T> {
    return () => this.settings;
  }

  private loadSettings() {
    this.serverGroups.forEach(group => group.parent?.deleteSubGroup(group.id));
    this.serverGroups.clear();
    const groups = [...(this.serverSettingsResource.data?.groups || [])].sort((a, b) => a.id.localeCompare(b.id));

    for (const group of groups) {
      let parentGroup = ROOT_SETTINGS_GROUP;
      const parent = getPathParent(group.id);
      const parentGroupCache = this.serverGroups.get(parent);

      if (parent && parentGroupCache && ROOT_SETTINGS_GROUP.has(parentGroupCache.id)) {
        parentGroup = ROOT_SETTINGS_GROUP.get(parentGroupCache.id)!;
      }

      this.serverGroups.set(group.id, parentGroup.createSubGroup(group.displayName));
    }
  }
}
