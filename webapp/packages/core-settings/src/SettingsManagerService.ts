/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

export enum FormFieldType {
  Checkbox,
  Combobox,
  Textarea,
  Input,
}

export interface SettingsGroupType {
  id: string;
  name: string;
}

export interface SettingsOptions {
  id: string | number;
  name: string;
}

export type SettingsScopeType = 'plugin' | 'core';

export interface SettingsData {
  scopeType: SettingsScopeType;
  scope: string;
  settingsData: ScopeSettingsItemOptions[];
}

export interface ScopeSettingsItem extends ScopeSettingsItemOptions {
  scopeType: SettingsScopeType;
  scope: string;
}

interface ScopeSettingsItemOptions {
  key: string;

  type: FormFieldType;
  name: string;
  groupId: string;
  description?: string;
  options?: SettingsOptions[];
}

@injectable()
export class SettingsManagerService {
  settings: ScopeSettingsItem[];
  groups: Map<string, SettingsGroupType>;

  constructor() {
    this.settings = [];
    this.groups = new Map();
  }

  addSettings(scopeType: SettingsScopeType, scope: string, settings: ScopeSettingsItemOptions[]) {
    this.settings.push(...settings.map(item => ({ ...item, scopeType, scope })));
  }

  addGroup(group: SettingsGroupType) {
    this.groups.set(group.id, group);
  }

  deleteSettings(scope: string, scopeType: string, key: string) {
    this.settings = this.settings.filter(
      settingsItem => settingsItem.scope !== scope && settingsItem.scopeType !== scopeType && settingsItem.key !== key,
    );
  }
}
