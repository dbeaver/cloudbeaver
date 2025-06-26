/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useId, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { Container, Filter, Group, s, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { type ISettingsSource, ROOT_SETTINGS_GROUP, SettingsGroup } from '@cloudbeaver/core-settings';
import { useTreeData, useTreeFilter } from '@cloudbeaver/plugin-navigation-tree';
import { SyncExecutor } from '@cloudbeaver/core-executor';

import classes from './Settings.module.css';
import { settingsFilter } from './settingsFilter.js';
import { SettingsGroups } from './SettingsGroups/SettingsGroups.js';
import { SettingsList } from './SettingsList.js';
import { useSettings } from './useSettings.js';

export interface ISettingsProps {
  source: ISettingsSource;
  accessor?: string[];
}

export const Settings = observer<ISettingsProps>(function Settings({ source, accessor }) {
  const translate = useTranslate();
  const settingsId = useId();
  const settings = useSettings(accessor);
  const [groupSelectExecutor] = useState(() => new SyncExecutor<string>());

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
    stateTransformers: [treeFilter.stateTransformer],
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
        .sort((a, b) => a.order - b.order)
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
    groupSelectExecutor.execute(id);
  }

  return (
    <Container gap overflow noWrap>
      <Group className={s(classes, { settingsGroups: true })} vertical box keepSize overflow>
        <SettingsGroups treeData={treeData} onClick={handleClick} />
      </Group>
      <Container className={s(classes, { settingsContainer: true })} overflow vertical gap noWrap>
        <Container gap keepSize>
          <Filter
            state={treeFilter}
            name="filter"
            placeholder={translate('plugin_settings_panel_search')}
            onChange={filter => treeFilter.setFilter(filter)}
          />
        </Container>
        <Container overflow vertical>
          <SettingsList
            settingsId={settingsId}
            treeData={treeData}
            treeFilter={treeFilter}
            source={source}
            settings={settings.settings}
            groupSelectExecutor={groupSelectExecutor}
          />
        </Container>
      </Container>
    </Container>
  );
});
