/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import {
  type ISettingDescription,
  type ISettingsSource,
  ROOT_SETTINGS_GROUP,
  type SettingsGroup as SettingsGroupType,
} from '@cloudbeaver/core-settings';
import type { ITreeData, ITreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import { SettingsGroup } from './SettingsGroup';
import { useTreeScrollSync } from './useTreeScrollSync';

interface Props {
  treeData: ITreeData;
  treeFilter: ITreeFilter;
  source: ISettingsSource;
  settings: Map<SettingsGroupType, ISettingDescription<any>[]>;
  onSettingsOpen?: (groupId: string) => void;
}

export const SettingsList = observer<Props>(function SettingsList({ treeData, treeFilter, source, settings, onSettingsOpen }) {
  const translate = useTranslate();
  const list = [];
  const groups = [...treeData.getChildren(treeData.rootId)];
  const ref = useTreeScrollSync(treeData, onSettingsOpen);

  while (groups.length) {
    const groupId = groups[0];
    groups.splice(0, 1, ...treeData.getChildren(groupId));

    const group = ROOT_SETTINGS_GROUP.get(groupId)!;

    list.push(group);
  }

  return (
    <Container ref={ref} gap overflow>
      {list.map(group => (
        <SettingsGroup key={group.id} group={group} source={source} settings={settings} treeFilter={treeFilter} />
      ))}
      {list.length === 0 && <TextPlaceholder>{translate('plugin_settings_panel_no_settings')}</TextPlaceholder>}
      <div style={{ height: '25%' }} />
    </Container>
  );
});
