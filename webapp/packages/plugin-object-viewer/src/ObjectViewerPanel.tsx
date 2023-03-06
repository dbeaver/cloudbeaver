/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Loader, TextPlaceholder, Button, useResource, useObservableRef, getComputed, useTranslate, useStyles } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { TabsBox, TabPanel, useTabLocalState, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import type { TabHandlerPanelComponent } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from './IObjectViewerTabState';
import { DBObjectPagePanel } from './ObjectPage/DBObjectPagePanel';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import { DBObjectPageTab } from './ObjectPage/DBObjectPageTab';

const styles = css`
  Tab {
    composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
  }
  tabs {
    composes: theme-background-background theme-text-text-primary-on-light from global;
  }
  tab-outer:only-child {
    display: none;
  }
`;

export const ObjectViewerPanel: TabHandlerPanelComponent<IObjectViewerTabState> = observer(function ObjectViewerPanel({
  tab,
}) {
  const translate = useTranslate();
  const style = useStyles(BASE_TAB_STYLES, styles);
  const dbObjectPagesService = useService(DBObjectPageService);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const innerTabState = useTabLocalState(() => new MetadataMap<string, any>());

  const objectId = tab.handlerState.objectId;
  const connectionKey = tab.handlerState.connectionKey || null;

  const state = useObservableRef(() => ({
    connecting: false,
    notFound: false,
  }), {
    connecting: observable.ref,
    notFound: observable.ref,
  }, false);

  const connection = useResource(ObjectViewerPanel, ConnectionInfoResource, connectionKey);
  const connected = getComputed(() => connection.data?.connected || false);

  const children = useResource(ObjectViewerPanel, NavTreeResource, objectId, {
    active: connected,
    onData: data => {
      state.notFound = !data.includes(objectId);
    },
    preload: [connection],
  });

  const node = useResource(ObjectViewerPanel, navNodeInfoResource, objectId, {
    onData(data) {
      tab.handlerState.tabIcon = data.icon;
      tab.handlerState.tabTitle = data.name;
    },
    active: !state.notFound,
    preload: [children],
  });

  const pages = dbObjectPagesService.orderedPages;

  const handleConnect = useCallback(async () => {
    if (state.connecting || !connection.data || !connectionKey) {
      return;
    }

    state.connecting = true;

    try {
      await connectionsManagerService.requireConnection(connectionKey);
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
        <Button type="button" mod={['unelevated']} onClick={handleConnect}>{translate('connections_connection_connect')}</Button>
      </TextPlaceholder>
    );
  }

  if (tab.handlerState.error || state.notFound) {
    return <TextPlaceholder>{translate('plugin_object_viewer_error')}</TextPlaceholder>;
  }

  return styled(style)(
    <>
      {node.data ? (
        <TabsBox
          currentTabId={tab.handlerState.pageId}
          tabs={pages.map(page => (
            <DBObjectPageTab
              key={page.key}
              tab={tab}
              page={page}
              style={styles}
              onSelect={dbObjectPagesService.selectPage}
            />
          ))}
          localState={innerTabState}
          style={styles}
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
    </>
  );
});
