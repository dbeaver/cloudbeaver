/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';

import { Container, Form, Group, GroupTitle, useTranslate } from '@cloudbeaver/core-blocks';
import { type ISettingDescriptionWithScope, ROOT_SETTINGS_GROUP, type SettingsGroup } from '@cloudbeaver/core-plugin';
import type { ISettingsSource } from '@cloudbeaver/core-settings';
import type { ITreeData } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupId } from './getSettingGroupId';
import { getSettingGroupIdFromElementId } from './getSettingGroupIdFromElementId';
import { querySettingsGroups } from './querySettingsGroups';
import { Setting } from './Setting';

interface Props {
  treeData: ITreeData;
  source: ISettingsSource;
  settings: Map<SettingsGroup, ISettingDescriptionWithScope<any>[]>;
  onSettingsOpen?: (groupId: string) => void;
}

export const SettingsList = observer<Props>(function SettingsList({ treeData, source, settings, onSettingsOpen }) {
  const ref = useRef<HTMLDivElement>(null);
  const translate = useTranslate();
  const list = [];
  const groups = [...treeData.getChildren(treeData.rootId)];

  while (groups.length) {
    const groupId = groups[0];
    groups.splice(0, 1, ...treeData.getChildren(groupId));

    const group = ROOT_SETTINGS_GROUP.get(groupId)!;
    const groupSettings = settings.get(group);

    list.push({ group, settings: groupSettings || [] });
  }

  useEffect(() => {
    if (ref.current) {
      ref.current.addEventListener('scroll', e => {
        const container = e.target as HTMLDivElement;

        const elements = querySettingsGroups(container);
        let firstVisibleElement: HTMLElement | undefined;

        for (const element of elements) {
          if (element.offsetTop + element.offsetHeight > container.scrollTop) {
            firstVisibleElement = element;
            break;
          }
        }

        if (firstVisibleElement) {
          const groupId = getSettingGroupIdFromElementId(firstVisibleElement.id);
          let group = ROOT_SETTINGS_GROUP.get(groupId)!;

          treeData.updateAllState({ selected: false, expanded: false });
          treeData.updateState(groupId, { selected: true });

          while (group.parent && group.parent !== ROOT_SETTINGS_GROUP) {
            treeData.updateState(group.parent.id, { expanded: true });
            group = group.parent;
          }
          onSettingsOpen?.(groupId);
        }
      });
    }
  });

  return (
    <Container ref={ref} style={{ height: '100%' }} gap overflow>
      {list.map(({ group, settings }) => (
        <Group key={group.id} id={getSettingGroupId(group.id)} vertical gap>
          <GroupTitle>{translate(group.name)}</GroupTitle>
          {settings.map((setting, i) => (
            <Setting key={i} source={source} setting={setting} />
          ))}
        </Group>
      ))}
    </Container>
  );
});
