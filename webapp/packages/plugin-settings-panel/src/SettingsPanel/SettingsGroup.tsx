/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Group, GroupTitle } from '@cloudbeaver/core-blocks';
import type { ISettingDescription, ISettingsSource, SettingsGroup as SettingsGroupType } from '@cloudbeaver/core-settings';

import { getSettingGroupId } from './getSettingGroupId.js';
import { Setting } from './Setting.js';
import { SettingsGroupTitle } from './SettingsGroupTitle.js';

interface Props {
  group: SettingsGroupType;
  source: ISettingsSource;
  settings: ISettingDescription<any>[];
}

export const SettingsGroup = observer<Props>(function SettingsGroup({ group, source, settings }) {
  return (
    <Group id={getSettingGroupId(group.id)} hidden={settings.length === 0} vertical gap>
      <GroupTitle sticky>
        <SettingsGroupTitle group={group} />
      </GroupTitle>
      {settings.map((setting, i) => (
        <Setting key={i} source={source} setting={setting} />
      ))}
    </Group>
  );
});
