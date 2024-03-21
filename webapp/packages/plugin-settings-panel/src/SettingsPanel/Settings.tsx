/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';

import { Container, Group, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { type ISettingsSource, ROOT_SETTINGS_GROUP } from '@cloudbeaver/core-settings';
import { useTreeData } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupId } from './getSettingGroupId';
import { SettingsGroups } from './SettingsGroups/SettingsGroups';
import { SettingsList } from './SettingsList';
import { useSettings } from './useSettings';

export interface ISettingsProps {
  source: ISettingsSource;
  accessor?: string[];
}

export const Settings = observer<ISettingsProps>(function Settings({ source, accessor }) {
  const translate = useTranslate();
  const settings = useSettings(accessor);

  const treeData = useTreeData({
    rootId: ROOT_SETTINGS_GROUP.id,
    getNode(id) {
      const group = ROOT_SETTINGS_GROUP.get(id);

      return {
        name: translate(group!.name),
        leaf: !group?.subGroups.length,
      };
    },
    getChildren(id) {
      return (ROOT_SETTINGS_GROUP.get(id)?.subGroups || [])
        .filter(group => settings.groups.has(group))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(group => group.id);
    },
    load() {
      return Promise.resolve();
    },
  });

  if (settings.settings.size === 0) {
    return <TextPlaceholder>{translate('plugin_settings_panel_empty')}</TextPlaceholder>;
  }

  function handleClick(id: string) {
    document.querySelector('#' + getSettingGroupId(id))?.scrollIntoView();
  }

  return (
    <Container gap overflow noWrap>
      <Group style={{ height: '100%', minWidth: '240px' }} box keepSize overflow hidden>
        <SettingsGroups treeData={treeData} onClick={handleClick} />
      </Group>
      <Container style={{ height: '100%' }} fill>
        <SettingsList treeData={treeData} source={source} settings={settings.settings} />
      </Container>
    </Container>
  );
});
