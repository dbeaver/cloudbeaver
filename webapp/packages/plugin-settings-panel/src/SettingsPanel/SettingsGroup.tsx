/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Group, GroupTitle, useTranslate } from '@cloudbeaver/core-blocks';
import type { ISettingDescription, ISettingsSource, SettingsGroup as SettingsGroupType } from '@cloudbeaver/core-settings';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import type { ITreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupId } from './getSettingGroupId.js';
import { Setting } from './Setting.js';
import { settingsFilter } from './settingsFilter.js';
import { SettingsGroupTitle } from './SettingsGroupTitle.js';

interface Props {
  group: SettingsGroupType;
  source: ISettingsSource;
  settings: Map<SettingsGroupType, ISettingDescription<any>[]>;
  treeFilter: ITreeFilter;
}

export const SettingsGroup = observer<Props>(function SettingsGroup({ group, source, settings, treeFilter }) {
  const translate = useTranslate();
  const groupSettings = getComputed(() => settings.get(group)?.filter(settingsFilter(translate, treeFilter.filter)) || [], isArraysEqual);

  return (
    <Group id={getSettingGroupId(group.id)} hidden={groupSettings.length === 0} vertical gap>
      <GroupTitle sticky>
        <SettingsGroupTitle group={group} />
      </GroupTitle>
      {groupSettings.map((setting, i) => (
        <Setting key={i} source={source} setting={setting} />
      ))}
    </Group>
  );
});
