/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { getCachedDataResourceLoaderState } from '@cloudbeaver/core-resource';
import { getObjectPropertyType, type ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import {
  ESettingsValueType,
  type ISettingDescription,
  ROOT_SETTINGS_GROUP,
  type SettingsDescriptionGetter,
  type SettingsGroup,
  SettingsProvider,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { getPathParent, ILoadableState, schema } from '@cloudbeaver/core-utils';

import { ServerSettingsResource } from './ServerSettingsResource';

@injectable()
export class ServerSettingsManagerService {
  readonly settingsProvider: SettingsProvider<schema.AnyZodObject>;
  readonly loaders: ReadonlyArray<ILoadableState>;
  private settings: ISettingDescription<any>[];
  private groups: Map<string, SettingsGroup>;
  constructor(
    private readonly serverSettingsResource: ServerSettingsResource,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    this.groups = new Map();
    this.settings = [];
    this.settingsProvider = new SettingsProvider(this.settingsResolverService, schema.object({}));
    this.loaders = [getCachedDataResourceLoaderState(this.serverSettingsResource, () => undefined)];

    serverSettingsResource.onDataUpdate.addHandler(this.loadSettings.bind(this));
    makeObservable<this, 'settings' | 'groups' | 'loadSettings'>(this, {
      settings: observable.shallow,
      groups: observable.shallow,
      loadSettings: action,
    });
  }

  getSettingsGetter<T>(): SettingsDescriptionGetter<T> {
    return this.settingsGetter.bind(this);
  }

  private settingsGetter<T>(): ISettingDescription<T>[] {
    return this.settings;
  }

  private loadSettings() {
    this.groups.forEach(group => group.parent?.deleteSubGroup(group.id));
    this.groups.clear();
    const groups = [...(this.serverSettingsResource.data?.groups || [])].sort((a, b) => a.id.localeCompare(b.id));
    const settings = this.serverSettingsResource.data?.settings || [];

    for (const group of groups) {
      let parentGroup = ROOT_SETTINGS_GROUP;
      const parent = getPathParent(group.id);
      const parentGroupCache = this.groups.get(parent);

      if (parent && parentGroupCache && ROOT_SETTINGS_GROUP.has(parentGroupCache.id)) {
        parentGroup = ROOT_SETTINGS_GROUP.get(parentGroupCache.id)!;
      }

      this.groups.set(group.id, parentGroup.createSubGroup(group.displayName));
    }

    for (const setting of settings) {
      this.settings.push({
        key: setting.id!,
        access: {
          scope: setting.scopes?.map(scope => {
            switch (scope) {
              case 'global':
                return 'server';
              case 'user':
                return 'client';
              default:
                return scope;
            }
          }) || ['server'],
        },
        group: this.groups.get(setting.category!)!,
        name: setting.displayName!,
        type: convertObjectPropertyInfoType(setting),
        description: setting.description!,
        options: setting.validValues?.map(value => ({ value, name: value })) || [],
      });
    }
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
