/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type ITreeData, Tree } from '@cloudbeaver/plugin-navigation-tree';

import { groupNodeRenderer } from './groupNodeRenderer.js';
import { SettingsGroupsEmpty } from './SettingsGroupsEmpty.js';

interface Props {
  treeData: ITreeData;
  onClick?: (groupId: string) => void;
}

export const SettingsGroups = observer<Props>(function SettingsGroups({ treeData, onClick }) {
  function getNodeHeight(id: string) {
    return 24;
  }

  return (
    <Tree
      data={treeData}
      getNodeHeight={getNodeHeight}
      nodeRenderers={[groupNodeRenderer]}
      emptyPlaceholder={SettingsGroupsEmpty}
      onNodeClick={onClick}
    />
  );
});
