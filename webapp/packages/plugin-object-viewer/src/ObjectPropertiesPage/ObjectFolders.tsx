/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { s, SContext, StyleRegistry, TextPlaceholder, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeManagerService, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { baseTabStyles, ITabData, TabList, tabListStyles, TabPanel, TabsState, useTabLocalState, verticalTabStyles } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { navNodeTabStyle } from '..';
import type { IObjectViewerTabState } from '../IObjectViewerTabState';
import { FolderPanelRenderer } from './FolderPanelRenderer';
import { FolderTabRenderer } from './FolderTabRenderer';
import styles from './ObjectFolders.m.css';

interface IProps {
  tab: ITab<IObjectViewerTabState>;
}

const objectFoldersRegistry: StyleRegistry = [
  [
    navNodeTabStyle,
    {
      mode: 'append',
      styles: [styles],
    },
  ],
  [
    baseTabStyles,
    {
      mode: 'append',
      styles: [verticalTabStyles, styles],
    },
  ],
  [
    tabListStyles,
    {
      mode: 'append',
      styles: [verticalTabStyles, styles],
    },
  ],
];

export const ObjectFolders = observer<IProps>(function ObjectFolders({ tab }) {
  const translate = useTranslate();
  const navNodeManagerService = useService(NavNodeManagerService);
  const navNodeViewService = useService(NavNodeViewService);
  const innerTabState = useTabLocalState(() => new MetadataMap<string, any>());
  const style = useS(styles, verticalTabStyles);

  const nodeId = tab.handlerState.objectId;
  const parentId = tab.handlerState.parentId;
  const parents = tab.handlerState.parents;
  let folderId = tab.handlerState.folderId;

  const children = useResource(ObjectFolders, NavTreeResource, nodeId);

  const folders = navNodeViewService.getFolders(nodeId, children.data) || [];
  const wrongFolder = !folders.includes(folderId) && folders.length > 0 && children.isLoaded() && !children.isLoading() && !children.isOutdated();

  if (wrongFolder) {
    folderId = folders[0];
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

  return (
    <SContext registry={objectFoldersRegistry}>
      {folders.length > 0 ? (
        <TabsState currentTabId={folderId} orientation="vertical" localState={innerTabState} lazy onChange={openFolder}>
          <div className={s(style, { verticalTabs: true })}>
            <TabList aria-label="Object folders">
              {folders.map(folderId => (
                <FolderTabRenderer key={folderId} nodeId={nodeId} folderId={folderId} parents={parents} />
              ))}
            </TabList>
            {folders.map(folderId => (
              <TabPanel key={folderId} className={s(style, { tabPanel: true })} tabId={folderId}>
                <FolderPanelRenderer key={folderId} nodeId={nodeId} folderId={folderId} parents={parents} />
              </TabPanel>
            ))}
          </div>
        </TabsState>
      ) : (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      )}
    </SContext>
  );
});
