/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, Group, GroupTitle, useExecutor, useTranslate } from '@cloudbeaver/core-blocks';
import type {
  IEditableSettingsSource,
  ISettingDescription,
  SettingsGroup as SettingsGroupType,
  SettingsResolverSource,
} from '@cloudbeaver/core-settings';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import type { ITreeFilter } from '@cloudbeaver/plugin-navigation-tree';

import { Setting } from './Setting.js';
import { settingsFilter } from './settingsFilter.js';
import { SettingsGroupTitle } from './SettingsGroupTitle.js';
import type { ISyncExecutor } from '@cloudbeaver/core-executor';
import { useRef } from 'react';
import { getSettingGroupId } from './getSettingGroupId.js';

interface Props {
  settingsId: string;
  group: SettingsGroupType;
  resolver: SettingsResolverSource;
  source: IEditableSettingsSource;
  settings: Map<SettingsGroupType, ISettingDescription<any>[]>;
  treeFilter: ITreeFilter;
  groupsHidden?: boolean;
  displayRestore?: boolean;
  groupSelectExecutor: ISyncExecutor<string>;
}

export const SettingsGroup = observer<Props>(function SettingsGroup({
  settingsId,
  group,
  resolver,
  source,
  settings,
  treeFilter,
  groupsHidden,
  displayRestore,
  groupSelectExecutor,
}) {
  const ref = useRef<HTMLDivElement>(null);
  const translate = useTranslate();
  const groupSettings = getComputed(() => settings.get(group)?.filter(settingsFilter(translate, treeFilter.filter)) || [], isArraysEqual);
  const hidden = groupSettings.length === 0;

  useExecutor({
    executor: groupSelectExecutor,
    handlers: [
      id => {
        if (id === group.id) {
          if (hidden) {
            const next = ref.current?.nextSibling;
            if (next instanceof HTMLElement) {
              next?.scrollIntoView();
            }
          } else {
            ref.current?.scrollIntoView();
          }
        }
      },
    ],
  });

  return (
    <Group ref={ref} id={getSettingGroupId(settingsId, group.id)} hidden={hidden} dense={groupsHidden} vertical gap compact>
      <GroupTitle hidden={groupsHidden} sticky>
        <SettingsGroupTitle group={group} />
      </GroupTitle>
      {groupSettings.map(setting => (
        <Setting key={setting.key} resolver={resolver} source={source} setting={setting} displayRestore={displayRestore} />
      ))}
    </Group>
  );
});
