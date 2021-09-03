/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { ITab, NavNodeManagerService, NavNodeViewService, NavTreeResource } from '@cloudbeaver/core-app';
import { ITabData, TabList, TabPanel, TabsState, useMapResource, verticalTabStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { IObjectViewerTabState } from '../IObjectViewerTabState';
import { FolderPanelRenderer } from './FolderPanelRenderer';
import { FolderTabRenderer } from './FolderTabRenderer';

const styles = composes(
  css`
    TabList {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
    vertical-tabs {
      composes: theme-border-color-background from global;
    }
    Tab {
      composes: theme-ripple theme-background-background theme-ripple-selectable from global;
    }
  `,
  css`
    Tab {
      color: inherit;
    }
    vertical-tabs {
      border-top: 1px solid;
      flex: 1;
    }
    TabPanel {
      overflow: auto !important;
    }
    TabList {
      border-right: 1px solid;
    }
  `
);

const tabStyles = [verticalTabStyles, styles];

interface IProps {
  tab: ITab<IObjectViewerTabState>;
}

export const ObjectFolders = observer<IProps>(function ObjectFolders({ tab }) {
  const navNodeManagerService = useService(NavNodeManagerService);
  const navNodeViewService = useService(NavNodeViewService);

  const nodeId = tab.handlerState.objectId;
  const parentId = tab.handlerState.parentId;
  let folderId = tab.handlerState.folderId;

  useMapResource(NavTreeResource, nodeId, {
    onLoad: async resource => {
      for (const nodeId of tab.handlerState.parents) {
        await resource.load(nodeId);
      }
    },
  });

  const folders = navNodeViewService.getFolders(nodeId) || [];

  function openFolder(tabData: ITabData) {
    navNodeManagerService.navToNode(nodeId, parentId, tabData.tabId);
  }

  useEffect(() => {
    if (!folders.includes(folderId) && folders.length > 0) {
      navNodeManagerService.navToNode(nodeId, parentId, folders[0]);
    }
  });

  if (!folders.includes(folderId) && folders.length > 0) {
    folderId = folders[0];
  }

  return styled(useStyles(verticalTabStyles, styles))(
    <TabsState currentTabId={folderId} orientation='vertical' onChange={openFolder}>
      <vertical-tabs>
        <TabList aria-label="Object folders">
          {folders.map(folderId => (
            <FolderTabRenderer key={folderId} nodeId={nodeId} folderId={folderId} style={tabStyles} />
          ))}
        </TabList>
        {folders.map(folderId => (
          <TabPanel key={folderId} tabId={folderId}>
            <FolderPanelRenderer key={folderId} nodeId={nodeId} folderId={folderId} style={tabStyles} />
          </TabPanel>
        ))}
      </vertical-tabs>
    </TabsState>
  );
});
