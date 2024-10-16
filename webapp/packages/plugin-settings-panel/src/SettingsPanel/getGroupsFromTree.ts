/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ROOT_SETTINGS_GROUP, type SettingsGroup as SettingsGroupType } from '@cloudbeaver/core-settings';
import type { ITreeData } from '@cloudbeaver/plugin-navigation-tree';

export function* getGroupsFromTree(treeData: ITreeData, groups: string[]): IterableIterator<SettingsGroupType> {
  for (const groupId of groups) {
    const group = ROOT_SETTINGS_GROUP.get(groupId);

    if (group) {
      yield group;
    }

    yield* getGroupsFromTree(treeData, treeData.getChildren(groupId));
  }
}
