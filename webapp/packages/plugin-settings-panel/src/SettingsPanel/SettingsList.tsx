/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, s, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { type ISettingDescription, type ISettingsSource, type SettingsGroup as SettingsGroupType } from '@cloudbeaver/core-settings';
import type { ITreeData, ITreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import { getGroupsFromTree } from './getGroupsFromTree.js';
import { SettingsGroup } from './SettingsGroup.js';
import classes from './SettingsList.module.css';
import { useTreeScrollSync } from './useTreeScrollSync.js';

interface Props {
  treeData: ITreeData;
  treeFilter: ITreeFilter;
  source: ISettingsSource;
  settings: Map<SettingsGroupType, ISettingDescription<any>[]>;
  onSettingsOpen?: (groupId: string) => void;
}

export const SettingsList = observer<Props>(function SettingsList({ treeData, treeFilter, source, settings, onSettingsOpen }) {
  const translate = useTranslate();
  const ref = useTreeScrollSync(treeData, onSettingsOpen);
  const groups = Array.from(getGroupsFromTree(treeData, treeData.getChildren(treeData.rootId)));

  return (
    <Container ref={ref} gap overflow>
      {groups.map(group => (
        <SettingsGroup key={group.id} group={group} source={source} settings={settings} treeFilter={treeFilter} />
      ))}
      {groups.length === 0 && <TextPlaceholder>{translate('plugin_settings_panel_no_settings')}</TextPlaceholder>}
      <div className={s(classes, { spaceFill: true })} />
    </Container>
  );
});
