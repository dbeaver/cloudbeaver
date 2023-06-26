/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';
import styled, { css } from 'reshadow';

import { BASE_CONTAINERS_STYLES, ColoredContainer, Group, GroupTitle, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';
import { SettingsManagerService } from '@cloudbeaver/core-settings';

import { SettingsInfoForm } from './SettingsInfoForm';

const styles = css`
  ColoredContainer {
    height: 100%;
  }
`;

export const SettingsPanelForm: React.FC = observer(function SettingsPanelForm() {
  const settingsManagerService = useService(SettingsManagerService);
  const pluginManagerService = useService(PluginManagerService);
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);

  const groups = Array.from(settingsManagerService.groups);
  const settings = settingsManagerService.settings;

  function getValue(key: string, scopeType: string, scope?: string) {
    let settings!: PluginSettings<any>;

    if (scope) {
      if (scopeType === 'plugin') {
        settings = pluginManagerService.getPluginSettings(scope);
      }

      if (scopeType === 'core') {
        settings = pluginManagerService.getCoreSettings(scope);
      }
    }

    return settings.getValue(key);
  }

  return styled(style)(
    <ColoredContainer gap overflow parent>
      <Group medium gap vertical overflow>
        {groups.map(([_, { id, name }]) => (
          <>
            <GroupTitle keepSize large>
              {name}
            </GroupTitle>
            <SettingsInfoForm
              fields={settings.map(settingsItem => ({
                ...settingsItem,
                value: getValue(settingsItem.key, settingsItem.scopeType, settingsItem.scope),
              }))}
              readOnly
            />
          </>
        ))}
      </Group>
    </ColoredContainer>,
  );
});
