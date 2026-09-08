/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type ITreeData, Tree, useTreeClickSelection } from '@cloudbeaver/plugin-navigation-tree';

import { groupNodeRenderer } from './groupNodeRenderer.js';
import { SettingsGroupsEmpty } from './SettingsGroupsEmpty.js';

interface Props {
  treeData: ITreeData;
  onClick?: (groupId: string) => void;
}

export const SettingsGroups = observer<Props>(function SettingsGroups({ treeData, onClick }) {
  const selection = useTreeClickSelection(treeData);

  function getNodeHeight() {
    return 24;
  }

  async function handleClick(id: string) {
    await selection.select(id);
    onClick?.(id);
  }

  return (
    <Tree
      className="tw:w-full tw:max-w-full tw:min-w-0"
      data={treeData}
      selection={selection}
      getNodeHeight={getNodeHeight}
      nodeRenderers={[groupNodeRenderer]}
      emptyPlaceholder={SettingsGroupsEmpty}
      onNodeClick={handleClick}
      onNodeActivate={onClick}
    />
  );
});
