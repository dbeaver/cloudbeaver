/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container } from '@cloudbeaver/core-blocks';
import {
  type ISettingDescription,
  type ISettingsSource,
  ROOT_SETTINGS_GROUP,
  type SettingsGroup as SettingsGroupType,
} from '@cloudbeaver/core-settings';
import type { ITreeData } from '@cloudbeaver/plugin-navigation-tree';

import { SettingsGroup } from './SettingsGroup';
import { useTreeScrollSync } from './useTreeScrollSync';

interface Props {
  treeData: ITreeData;
  source: ISettingsSource;
  settings: Map<SettingsGroupType, ISettingDescription<any>[]>;
  onSettingsOpen?: (groupId: string) => void;
}

export const SettingsList = observer<Props>(function SettingsList({ treeData, source, settings, onSettingsOpen }) {
  const list = [];
  const groups = [...treeData.getChildren(treeData.rootId)];
  const ref = useTreeScrollSync(treeData, onSettingsOpen);

  while (groups.length) {
    const groupId = groups[0];
    groups.splice(0, 1, ...treeData.getChildren(groupId));

    const group = ROOT_SETTINGS_GROUP.get(groupId)!;
    const groupSettings = settings.get(group);

    list.push({ group, settings: groupSettings || [] });
  }

  return (
    <Container ref={ref} style={{ height: '100%' }} gap overflow>
      {list.map(({ group, settings }) => (
        <SettingsGroup key={group.id} group={group} source={source} settings={settings} />
      ))}
      <div style={{ height: 'calc(100% - 100px)' }} hidden />
    </Container>
  );
});
