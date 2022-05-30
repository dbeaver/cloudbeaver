/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';
import styled, { css } from 'reshadow';

import { ITab, NavNodeManagerService, NavNodeViewService, NavTreeResource } from '@cloudbeaver/core-app';
import { Loader, TextPlaceholder, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { BASE_TAB_STYLES, ITabData, TabList, TabPanel, TabsState, useTabLocalState, verticalTabStyles } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { IObjectViewerTabState } from '../IObjectViewerTabState';
import { FolderPanelRenderer } from './FolderPanelRenderer';
import { FolderTabRenderer } from './FolderTabRenderer';

const styles = css`
    Tab {
      composes: theme-ripple theme-background-background theme-ripple-selectable from global;
      color: inherit;
    }
    vertical-tabs {
      composes: theme-border-color-background from global;
      border-top: 1px solid;
      flex: 1;
    }
    TabPanel {
      overflow: auto !important;
    }
    TabList {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
      border-right: 1px solid;
    }
    TabTitle {
      flex: 1;
    }
    tab-loader {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
      margin-right: 16px;
      overflow: hidden;
    }
    ExceptionMessage {
      padding: 24px;
    }
  `;

const tabStyles = [BASE_TAB_STYLES, verticalTabStyles, styles];

interface IProps {
  tab: ITab<IObjectViewerTabState>;
}

export const ObjectFolders = observer<IProps>(function ObjectFolders({ tab }) {
  const translate = useTranslate();
  const navNodeManagerService = useService(NavNodeManagerService);
  const navNodeViewService = useService(NavNodeViewService);
  const style = useStyles(BASE_TAB_STYLES, verticalTabStyles, styles);
  const innerTabState = useTabLocalState(() => new MetadataMap<string, any>());

  const nodeId = tab.handlerState.objectId;
  const parentId = tab.handlerState.parentId;
  const parents = tab.handlerState.parents;
  let folderId = tab.handlerState.folderId;

  const children = useMapResource(ObjectFolders, NavTreeResource, nodeId, {
    onLoad: async resource => !(await resource.preloadNodeParents(parents, nodeId)),
  });

  const folders = navNodeViewService.getFolders(nodeId) || [];
  const wrongFolder = (
    !folders.includes(folderId)
    && folders.length > 0
    && children.isLoaded()
    && !children.isLoading()
    && !children.isOutdated()
  );

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

  return styled(style)(
    <Loader state={children} style={style}>{() => styled(style)(
      <>
        {folders.length > 0 ? (
          <TabsState currentTabId={folderId} orientation='vertical' localState={innerTabState} lazy onChange={openFolder}>
            <vertical-tabs>
              <TabList aria-label="Object folders">
                {folders.map(folderId => (
                  <FolderTabRenderer
                    key={folderId}
                    nodeId={nodeId}
                    folderId={folderId}
                    parents={parents}
                    style={tabStyles}
                  />
                ))}
              </TabList>
              {folders.map(folderId => (
                <TabPanel key={folderId} tabId={folderId}>
                  <FolderPanelRenderer
                    key={folderId}
                    nodeId={nodeId}
                    folderId={folderId}
                    parents={parents}
                    style={tabStyles}
                  />
                </TabPanel>
              ))}
            </vertical-tabs>
          </TabsState>
        ) : (
          <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
        )}
      </>
    )}
    </Loader>
  );
});
