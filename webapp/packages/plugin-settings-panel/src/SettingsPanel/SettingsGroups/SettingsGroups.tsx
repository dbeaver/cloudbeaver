/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ITreeData, Tree } from '@cloudbeaver/plugin-navigation-tree';

import { getSettingGroupId } from '../getSettingGroupId';
import { groupNodeRenderer } from './groupNodeRenderer';

interface Props {
  treeData: ITreeData;
}

export const SettingsGroups = observer<Props>(function SettingsGroups({ treeData }) {
  function getNodeHeight(id: string) {
    return 24;
  }

  function handleClick(id: string) {
    document.querySelector('#' + getSettingGroupId(id))?.scrollIntoView();
  }

  return <Tree data={treeData} getNodeHeight={getNodeHeight} nodeRenderers={[groupNodeRenderer]} onNodeClick={handleClick} />;
});
