/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Filter, Group, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { type ISettingsSource, ROOT_SETTINGS_GROUP, SettingsGroup } from '@cloudbeaver/core-settings';
import { useTreeData, useTreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupId } from './getSettingGroupId';
import { settingsFilter } from './settingsFilter';
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

  function filterExistsGroups(group: SettingsGroup) {
    return settings.groups.has(group);
  }

  const treeFilter = useTreeFilter({
    isNodeMatched(nodeId, filter) {
      const group = ROOT_SETTINGS_GROUP.get(nodeId)!;
      const groupSettings = settings.settings.get(group);

      if (!groupSettings) {
        return false;
      }

      return groupSettings.some(settingsFilter(translate, filter));
    },
  });

  const treeData = useTreeData({
    rootId: ROOT_SETTINGS_GROUP.id,
    childrenTransformers: [treeFilter.transformer],
    getNode(id) {
      const group = ROOT_SETTINGS_GROUP.get(id);

      return {
        name: translate(group!.name),
        leaf: !group?.subGroups.filter(filterExistsGroups).length,
      };
    },
    getChildren(id) {
      return (ROOT_SETTINGS_GROUP.get(id)?.subGroups || [])
        .filter(filterExistsGroups)
        .sort((a, b) => translate(a.name).localeCompare(translate(b.name)))
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
      <Group style={{ height: '100%', minWidth: '240px' }} box keepSize overflow>
        <SettingsGroups treeData={treeData} onClick={handleClick} />
      </Group>
      <Container style={{ height: '100%' }} overflow vertical gap fill>
        <Container gap keepSize>
          <Filter
            value={treeFilter.filter}
            placeholder={translate('plugin_settings_panel_search')}
            onChange={filter => treeFilter.setFilter(filter)}
          />
        </Container>
        <SettingsList treeData={treeData} treeFilter={treeFilter} source={source} settings={settings.settings} />
      </Container>
    </Container>
  );
});
