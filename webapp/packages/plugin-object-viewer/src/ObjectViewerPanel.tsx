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

import { TabHandlerPanelComponent, NavTreeResource, NavNodeInfoResource } from '@cloudbeaver/core-app';
import { Loader, TextPlaceholder, Button, useMapResource, useObservableRef, getComputed } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabsBox, TabPanel, useTabLocalState, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';

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
    ExceptionMessage {
      padding: 24px;
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
  const connectionId = tab.handlerState.connectionId || null;
  const parentId = tab.handlerState.parentId;
  const parents = tab.handlerState.parents;

  const state = useObservableRef(() => ({
    connecting: false,
    notFound: false,
  }), {
    connecting: observable.ref,
    notFound: observable.ref,
  }, false);

  const connection = useMapResource(ObjectViewerPanel, ConnectionInfoResource, connectionId, {
    isActive: resource => !connectionId || !resource.has(connectionId),
  });

  const connected = getComputed(() => connection.data?.connected || false);

  const children = useMapResource(ObjectViewerPanel, NavTreeResource, parentId, {
    onLoad: async resource => {
      if (!connected) {
        return true;
      }

      const preload = await resource.preloadNodeParents(parents);
      state.notFound = !preload;
      return state.notFound;
    },
    active: connected,
    onData: data => {
      state.notFound = !data.includes(objectId);
    },
    preload: [connection],
  });

  const node = useMapResource(ObjectViewerPanel, navNodeInfoResource, objectId, {
    onLoad: async () => !(await children.resource.preloadNodeParents(parents, objectId)),
    onData(data) {
      tab.handlerState.tabIcon = data.icon;
      tab.handlerState.tabTitle = data.name;
    },
    active: !state.notFound,
    preload: [children],
  });

  const pages = dbObjectPagesService.orderedPages;

  const handleConnect = useCallback(async () => {
    if (state.connecting || !connection.data) {
      return;
    }

    state.connecting = true;

    try {
      await connectionsManagerService.requireConnection(connection.data.id);
    } finally {
      state.connecting = false;
    }
  }, []);

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
    <Loader state={[node, children]} style={styles}>
      {() => styled(style)(
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
      )}
    </Loader>
  );
});
