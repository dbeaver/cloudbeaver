import { injectable } from '@cloudbeaver/core-di';
import type { FormFieldType, SettingsGroup } from '@cloudbeaver/plugin-settings-panel';

export type SettingsScopeType = 'plugin' | 'core';

export interface ScopeSettingsItem extends ScopeSettingsItemOptions {
  scopeType: SettingsScopeType;
  scope?: string;
}

interface ScopeSettingsItemOptions {
  key: string;

  type: FormFieldType;
  name: string;
  groupId: string;
  description?: string;
  options?: any[];
}

@injectable()
export class SettingsManagerService {
  settings: ScopeSettingsItem[];
  groups: Map<string, SettingsGroup>;

  constructor() {
    this.settings = [];
    this.groups = new Map();
  }

  addSettings(scopeType: SettingsScopeType, scope: string, settings: ScopeSettingsItemOptions[]) {
    this.settings.push(...settings.map(item => ({ ...item, scopeType, scope })));
  }

  addGroup(group: SettingsGroup) {
    this.groups.set(group.id, group);
  }

  deleteSettings(settings: ScopeSettingsItem | string) {
    if (typeof settings === 'string') {
      this.settings = this.settings.filter(item => item.scope !== settings);
    } else {
      this.settings = this.settings.filter(item => item.scope !== settings.scope);
    }
  }
}
