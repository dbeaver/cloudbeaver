/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { getObjectPropertyType, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import {
  ESettingsValueType,
  type ISettingDescription,
  ROOT_SETTINGS_GROUP,
  type SettingDescriptionTransformer,
  type SettingsDescriptionGetter,
  type SettingsGroup,
  SettingsProvider,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { getPathParent, type ILoadableState, schema } from '@cloudbeaver/core-utils';

import { ServerSettingsResource } from './ServerSettingsResource.js';

@injectable()
export class ServerSettingsManagerService {
  readonly settingsProvider: SettingsProvider<schema.AnyZodObject>;
  readonly loaders: ReadonlyArray<ILoadableState>;

  get providedSettings(): Set<string> {
    return new Set(this.settings.map(setting => setting.key as string));
  }

  private get settings(): ReadonlyArray<ISettingDescription<any>> {
    return (this.serverSettingsResource.data?.settings || []).map(this.mapSetting.bind(this)).filter(Boolean) as ISettingDescription<any>[];
  }

  private serverGroups: Map<string, SettingsGroup>;
  private overrideGroups: Map<string, SettingsGroup>;
  private settingTransformers: Map<string, SettingDescriptionTransformer>;

  constructor(
    private readonly serverSettingsResource: ServerSettingsResource,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    this.serverGroups = new Map();
    this.overrideGroups = new Map();
    this.settingTransformers = new Map();
    this.settingsProvider = new SettingsProvider(this.settingsResolverService, schema.object({}));
    this.loaders = [getCachedDataResourceLoaderState(this.serverSettingsResource, () => undefined)];

    serverSettingsResource.onDataUpdate.addHandler(this.loadSettings.bind(this));
    makeObservable<this, 'settings' | 'providedSettings' | 'serverGroups' | 'overrideGroups' | 'settingTransformers' | 'loadSettings'>(this, {
      settings: computed,
      providedSettings: computed,
      serverGroups: observable.shallow,
      overrideGroups: observable.shallow,
      settingTransformers: observable.shallow,
      loadSettings: action,
    });
  }

  getSettingsGetter<T>(): SettingsDescriptionGetter<T> {
    return () => this.settings;
  }

  setGroupOverride(group: string, override: SettingsGroup) {
    this.overrideGroups.set(group, override);
  }

  setSettingTransformer(key: string, transformer: SettingDescriptionTransformer) {
    if (this.settingTransformers.has(key)) {
      throw new Error('Setting transformer already exists');
    }

    this.settingTransformers.set(key, transformer);
  }

  private mapSetting(property: ObjectPropertyInfo): ISettingDescription<any> | null {
    const key = property.id!;
    const transformer = this.settingTransformers.get(key);

    const setting: ISettingDescription<any> = {
      key,
      access: {
        scope: this.mapSettingScope(property.scopes || []),
      },
      group: this.getSettingGroup(property.category),
      type: convertObjectPropertyInfoType(property),

      name: property.displayName!,
      description: property.description!,
      options: property.validValues?.map(value => ({ value, name: value })) || [],
    };

    if (transformer) {
      return transformer(setting);
    }

    return setting;
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

  private getSettingGroup(group?: string): SettingsGroup {
    if (!group) {
      return ROOT_SETTINGS_GROUP;
    }

    const overrideGroup = this.overrideGroups.get(group);
    if (overrideGroup) {
      return overrideGroup;
    }
    return this.serverGroups.get(group) || ROOT_SETTINGS_GROUP;
  }

  private mapSettingScope(scopes: string[]): string[] {
    if (scopes.length === 0) {
      return ['server'];
    }

    return scopes.map(scope => {
      switch (scope) {
        case 'global':
          return 'server';
        case 'user':
          return 'client';
        default:
          return scope;
      }
    });
  }
}

function convertObjectPropertyInfoType(property: ObjectPropertyInfo): ESettingsValueType {
  switch (getObjectPropertyType(property)) {
    case 'selector':
      return ESettingsValueType.Select;
    case 'checkbox':
      return ESettingsValueType.Checkbox;
    case 'textarea':
      return ESettingsValueType.Textarea;
    case 'input':
    default:
      return ESettingsValueType.Input;
  }
}
