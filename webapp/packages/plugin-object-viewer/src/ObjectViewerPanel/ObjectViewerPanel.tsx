/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import {
  Button,
  Loader,
  s,
  SContext,
  StyleRegistry,
  TextPlaceholder,
  useObservableRef,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { TabPanel, TabsBox, TabStyles, useTabLocalState } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { TabHandlerPanelComponent } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from '../IObjectViewerTabState';
import { DBObjectPagePanel } from '../ObjectPage/DBObjectPagePanel';
import { DBObjectPageService } from '../ObjectPage/DBObjectPageService';
import { DBObjectPageTab } from '../ObjectPage/DBObjectPageTab';
import styles from './styles/ObjectViewerPanel.m.css';
import ObjectViewerPanelTab from './styles/ObjectViewerPanelTab.m.css';

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
  const connectionsManagerService = useService(ConnectionsManagerService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const notificationService = useService(NotificationService);
  const innerTabState = useTabLocalState(() => new MetadataMap<string, any>());
  const style = useS(styles);

  const objectId = tab.handlerState.objectId;
  const connectionKey = tab.handlerState.connectionKey || null;

  const state = useObservableRef(
    () => ({
      connecting: false,
      notFound: false,
    }),
    {
      connecting: observable.ref,
      notFound: observable.ref,
    },
    false,
  );

  const connection = useResource(ObjectViewerPanel, ConnectionInfoResource, connectionKey);

  const node = useResource(ObjectViewerPanel, navNodeInfoResource, objectId, {
    onData(data) {
      runInAction(() => {
        tab.handlerState.tabIcon = data.icon;
        tab.handlerState.tabTitle = data.name;
      });
    },
    active: !state.notFound && connection.data?.connected,
  });

  const pages = dbObjectPagesService.orderedPages;

  const handleConnect = useCallback(async () => {
    if (state.connecting || !connection.data || !connectionKey) {
      return;
    }

    state.connecting = true;

    try {
      await connectionsManagerService.requireConnection(connectionKey);
    } catch (exception: any) {
      notificationService.logException(exception);
    } finally {
      state.connecting = false;
    }
  }, [connectionKey]);

  if (connection.data && !connection.data.connected) {
    if (state.connecting || connection.isLoading()) {
      return <Loader />;
    }

    return (
      <TextPlaceholder>
        <Button type="button" mod={['unelevated']} onClick={handleConnect}>
          {translate('connections_connection_connect')}
        </Button>
      </TextPlaceholder>
    );
  }

  if (tab.handlerState.error || state.notFound) {
    return <TextPlaceholder>{translate('plugin_object_viewer_error')}</TextPlaceholder>;
  }

  return node.data ? (
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
  );
});
