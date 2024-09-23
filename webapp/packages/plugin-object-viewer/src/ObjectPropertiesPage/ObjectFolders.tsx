/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { SContext, type StyleRegistry, TextPlaceholder, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import {
  type ITabData,
  TabList,
  TabListStyles,
  TabPanel,
  TabPanelStyles,
  TabsState,
  TabStyles,
  TabTitleStyles,
  useTabLocalState,
} from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import type { IObjectViewerTabState } from '../IObjectViewerTabState.js';
import { FolderPanelRenderer } from './FolderPanelRenderer.js';
import { FolderTabRenderer } from './FolderTabRenderer.js';
import NavNodeTabStyle from './NavNodeTab.module.css';
import ObjectFoldersNavNodeTab from './shared/ObjectFoldersNavNodeTab.module.css';
import ObjectFoldersTab from './shared/ObjectFoldersTab.module.css';
import ObjectFoldersTabList from './shared/ObjectFoldersTabList.module.css';
import ObjectFoldersTabPanel from './shared/ObjectFoldersTabPanel.module.css';
import ObjectFoldersTabTitle from './shared/ObjectFoldersTabTitle.module.css';

interface IProps {
  tab: ITab<IObjectViewerTabState>;
}

const objectFoldersRegistry: StyleRegistry = [
  [
    NavNodeTabStyle,
    {
      mode: 'append',
      styles: [ObjectFoldersNavNodeTab],
    },
  ],
  [
    TabStyles,
    {
      mode: 'append',
      styles: [ObjectFoldersTab],
    },
  ],
  [
    TabListStyles,
    {
      mode: 'append',
      styles: [ObjectFoldersTabList],
    },
  ],
  [
    TabPanelStyles,
    {
      mode: 'append',
      styles: [ObjectFoldersTabPanel],
    },
  ],
  [
    TabTitleStyles,
    {
      mode: 'append',
      styles: [ObjectFoldersTabTitle],
    },
  ],
];

export const ObjectFolders = observer<IProps>(function ObjectFolders({ tab }) {
  const translate = useTranslate();
  const navNodeManagerService = useService(NavNodeManagerService);
  const navNodeViewService = useService(NavNodeViewService);
  const innerTabState = useTabLocalState(() => new MetadataMap<string, any>());

  const nodeId = tab.handlerState.objectId;
  const parentId = tab.handlerState.parentId;
  const parents = tab.handlerState.parents;
  let folderId = tab.handlerState.folderId;

  const children = useResource(ObjectFolders, NavTreeResource, nodeId);

  const folders = navNodeViewService.getFolders(nodeId, children.data) || [];
  const wrongFolder = !folders.includes(folderId) && folders.length > 0 && children.isLoaded() && !children.isLoading() && !children.isOutdated();

  if (wrongFolder) {
    folderId = folders[0]!;
  }

  function openFolder(tabData: ITabData) {
    if (tabData.tabId === folderId) {
      return;
    }

    navNodeManagerService.navToNode(nodeId, parentId, tabData.tabId);
  }

  useEffect(() => {
    if (wrongFolder) {
      navNodeManagerService.navToNode(nodeId, parentId, folderId);
    }
  });

  return folders.length > 0 ? (
    <TabsState currentTabId={folderId} orientation="vertical" localState={innerTabState} lazy onChange={openFolder}>
      <SContext registry={objectFoldersRegistry}>
        <TabList aria-label="Object folders" vertical>
          {folders.map(folderId => (
            <FolderTabRenderer key={folderId} nodeId={nodeId} folderId={folderId} parents={parents} />
          ))}
        </TabList>
        {folders.map(folderId => (
          <TabPanel key={folderId} tabId={folderId}>
            <FolderPanelRenderer key={folderId} nodeId={nodeId} folderId={folderId} parents={parents} />
          </TabPanel>
        ))}
      </SContext>
    </TabsState>
  ) : (
    <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
  );
});
