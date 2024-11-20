/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';

import { getComputed, s, SContext, type StyleRegistry, TextPlaceholder, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { TabPanel, TabsBox, TabStyles, useTabLocalState } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { ConnectionShieldLazy } from '@cloudbeaver/plugin-connections';
import type { TabHandlerPanelComponent } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from '../IObjectViewerTabState.js';
import { DBObjectPagePanel } from '../ObjectPage/DBObjectPagePanel.js';
import { DBObjectPageService } from '../ObjectPage/DBObjectPageService.js';
import { DBObjectPageTab } from '../ObjectPage/DBObjectPageTab.js';
import styles from './shared/ObjectViewerPanel.module.css';
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
  const style = useS(styles);

  const objectId = tab.handlerState.objectId;
  const connectionKey = tab.handlerState.connectionKey || null;

  const connection = useResource(ObjectViewerPanel, ConnectionInfoResource, connectionKey);

  const node = useResource(ObjectViewerPanel, navNodeInfoResource, objectId, {
    onData(data) {
      runInAction(() => {
        tab.handlerState.tabIcon = data.icon;
        tab.handlerState.tabTitle = data.name;
      });
    },
    active: getComputed(() => !!connection.tryGetData?.connected && !connection.outdated),
  });

  const pages = dbObjectPagesService.orderedPages;

  if (tab.handlerState.error) {
    return <TextPlaceholder>{translate('plugin_object_viewer_error')}</TextPlaceholder>;
  }

  return (
    <ConnectionShieldLazy connectionKey={connectionKey}>
      {node.tryGetData ? (
        <TabsBox
          currentTabId={tab.handlerState.pageId}
          tabsClassName={s(style, { tabs: true })}
          tabs={
            <SContext registry={tabsRegistry}>
              {pages.map(page => (
                <DBObjectPageTab key={page.key} tab={tab} page={page} onSelect={dbObjectPagesService.selectPage} />
              ))}
            </SContext>
          }
          localState={innerTabState}
        >
          {pages.map(page => (
            <TabPanel key={page.key} tabId={page.key} lazy>
              <DBObjectPagePanel tab={tab} page={page} />
            </TabPanel>
          ))}
        </TabsBox>
      ) : (
        <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>
      )}
    </ConnectionShieldLazy>
  );
});
