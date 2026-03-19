/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect } from 'react';
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

import { getComputed, SContext, type StyleRegistry, TextPlaceholder, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { TabList, TabPanel, TabsState, TabStyles, useTabLocalState } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { ConnectionShieldLazy } from '@cloudbeaver/plugin-connections';
import type { TabHandlerPanelComponent } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from '../IObjectViewerTabState.js';
import { DBObjectPagePanel } from '../ObjectPage/DBObjectPagePanel.js';
import { DBObjectPageService } from '../ObjectPage/DBObjectPageService.js';
import { DBObjectPageTab } from '../ObjectPage/DBObjectPageTab.js';
import ObjectViewerPanelTab from './shared/ObjectViewerPanelTab.module.css';

const tabsRegistry: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [ObjectViewerPanelTab],
    },
  ],
];

export const ObjectViewerPanel: TabHandlerPanelComponent<IObjectViewerTabState> = observer(function ObjectViewerPanel({ tab }) {
  const translate = useTranslate();
  const dbObjectPagesService = useService(DBObjectPageService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const innerTabState = useTabLocalState(() => new MetadataMap<string, any>());

  const objectId = tab.handlerState.objectId;
  const connectionKey = tab.handlerState.connectionKey || null;

  const connection = useResource(ObjectViewerPanel, ConnectionInfoResource, connectionKey);

  const node = useResource(ObjectViewerPanel, navNodeInfoResource, objectId, {
    active: getComputed(() => !!connection.tryGetData?.connected && !connection.isOutdated()),
  });

  useEffect(() => {
    runInAction(() => {
      if (node.tryGetData) {
        tab.handlerState.tabIcon = node.tryGetData.icon;
        tab.handlerState.tabTitle = node.tryGetData.name;
      }
    });
  }, [node.tryGetData, tab.handlerState]);

  const pages = dbObjectPagesService.orderedPages;

  if (tab.handlerState.error) {
    return <TextPlaceholder>{translate('plugin_object_viewer_error')}</TextPlaceholder>;
  }

  return (
    <ConnectionShieldLazy connectionKey={connectionKey}>
      {node.tryGetData ? (
        <TabsState currentTabId={tab.handlerState.pageId} localState={innerTabState}>
          <div className="tw:outline-none tw:flex-1 tw:flex tw:flex-col tw:max-w-full">
            <TabList className="theme-background-background theme-text-text-primary-on-light">
              <SContext registry={tabsRegistry}>
                {pages.map(page => (
                  <DBObjectPageTab key={page.key} tab={tab} page={page} onSelect={dbObjectPagesService.selectPage} />
                ))}
              </SContext>
            </TabList>
            {pages.map(page => (
              <TabPanel key={page.key} className="tw:flex-1 tw:flex tw:overflow-hidden tw:relative" tabId={page.key} lazy>
                <DBObjectPagePanel tab={tab} page={page} />
              </TabPanel>
            ))}
          </div>
        </TabsState>
      ) : (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      )}
    </ConnectionShieldLazy>
  );
});
