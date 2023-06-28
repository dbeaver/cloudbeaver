/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Group, GroupTitle } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { PluginManagerService } from '@cloudbeaver/core-plugin';
import { SettingsGroupType, SettingsManagerService, SettingsScopeType } from '@cloudbeaver/core-settings';

import { SettingsInfoForm } from './SettingsInfoForm';

interface Props {
  group: SettingsGroupType;
}

export const SettingsGroup = observer<Props>(function SettingsGroup({ group }) {
  const settingsManagerService = useService(SettingsManagerService);
  const pluginManagerService = useService(PluginManagerService);

  function getValue(scope: string, scopeType: SettingsScopeType, key: string) {
    const settings = pluginManagerService.getSettings(scope, scopeType);
    return settings?.getValue(key);
  }

  const settings = settingsManagerService.settings
    .filter(settingsItem => settingsItem.groupId === group.id)
    .map(settingsItem => ({ ...settingsItem, value: getValue(settingsItem.scope, settingsItem.scopeType, settingsItem.key) }));

  return styled(BASE_CONTAINERS_STYLES)(
    <Group gap vertical>
      <GroupTitle keepSize large>
        {group.name}
      </GroupTitle>
      <SettingsInfoForm fields={settings} readOnly />
    </Group>,
  );
});
