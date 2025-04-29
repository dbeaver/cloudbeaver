/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';

import { useAutoLoad, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ISettingDescription, ROOT_SETTINGS_GROUP, SettingsGroup, SettingsManagerService } from '@cloudbeaver/core-settings';

interface ISettings {
  settings: Map<SettingsGroup, ISettingDescription<any>[]>;
  groups: Set<SettingsGroup>;
}

export function useSettings(accessor?: string[]): ISettings {
  const settingsManagerService = useService(SettingsManagerService);

  useAutoLoad(useSettings, settingsManagerService.loaders);

  return useObservableRef(
    () => ({
      get settings() {
        const map = new Map();
        const settings = this.settingsManagerService.activeSettings
          .filter(setting => this.accessor?.some(value => setting.access.scope.includes(value)))
          .sort((a, b) => a.name.localeCompare(b.name));

        for (const setting of settings) {
          map.set(setting.group, [...(map.get(setting.group) || []), setting]);
        }

        return map;
      },
      get groups() {
        const groups = new Set(this.settings.keys());

        for (const group of groups) {
          if (group.parent) {
            groups.add(group.parent);
          }
        }

        return groups;
      },
      groupChildren(id: string) {
        return (ROOT_SETTINGS_GROUP.get(id)?.subGroups || []).filter(group => this.groups.has(group)).sort((a, b) => a.name.localeCompare(b.name));
      },
    }),
    {
      settings: computed,
      groups: computed,
      settingsManagerService: observable.ref,
      accessor: observable.ref,
    },
    { settingsManagerService, accessor },
  );
}
