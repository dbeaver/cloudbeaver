/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { getObjectPropertyType, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import {
  ESettingsValueType,
  type ISettingDescription,
  ROOT_SETTINGS_GROUP,
  type SettingDescriptionTransformer,
  type SettingsGroup,
} from '@cloudbeaver/core-settings';

@injectable()
export class SettingsTransformationService {
  private overrideGroups: Map<string, SettingsGroup>;
  private settingTransformers: Map<string, SettingDescriptionTransformer>;

  constructor() {
    this.overrideGroups = new Map();
    this.settingTransformers = new Map();

    makeObservable<this, 'overrideGroups' | 'settingTransformers'>(this, {
      overrideGroups: observable.shallow,
      settingTransformers: observable.shallow,
    });
  }

  setGroupOverride(group: string, override: SettingsGroup): void {
    this.overrideGroups.set(group, override);
  }

  setSettingTransformer(key: string, transformer: SettingDescriptionTransformer): void {
    if (this.settingTransformers.has(key)) {
      throw new Error('Setting transformer already exists');
    }

    this.settingTransformers.set(key, transformer);
  }

  mapSetting(groups: Map<string, SettingsGroup>, property: ObjectPropertyInfo): ISettingDescription<any> | null {
    const key = property.id!;
    const transformer = this.settingTransformers.get(key);

    const setting: ISettingDescription<any> = {
      key,
      access: {
        scope: this.mapSettingScope(property.scopes || []),
      },
      group: this.getSettingGroup(groups, property.category),
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

  private getSettingGroup(groups: Map<string, SettingsGroup>, group?: string): SettingsGroup {
    if (!group) {
      return ROOT_SETTINGS_GROUP;
    }

    const overrideGroup = this.overrideGroups.get(group);
    if (overrideGroup) {
      return overrideGroup;
    }
    return groups.get(group) || ROOT_SETTINGS_GROUP;
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
