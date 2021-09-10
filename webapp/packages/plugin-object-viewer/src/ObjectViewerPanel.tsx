/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { TabHandlerPanelComponent, NavTreeResource, NavNodeInfoResource } from '@cloudbeaver/core-app';
import { Loader, TabsBox, TabPanel, TextPlaceholder, Button, useMapResource, useObservableRef } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { IObjectViewerTabState } from './IObjectViewerTabState';
import { DBObjectPagePanel } from './ObjectPage/DBObjectPagePanel';
import { DBObjectPageService } from './ObjectPage/DBObjectPageService';
import { DBObjectPageTab } from './ObjectPage/DBObjectPageTab';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
    tabs {
      composes: theme-background-background theme-text-text-primary-on-light from global;
    }
  `,
  css`
    tab-outer:only-child {
      display: none;
    }
    ExceptionMessage {
      padding: 24px;
    }
  `
);

export const ObjectViewerPanel: TabHandlerPanelComponent<IObjectViewerTabState> = observer(function ObjectViewerPanel({
  tab,
}) {
  const translate = useTranslate();
  const style = useStyles(styles);
  const dbObjectPagesService = useService(DBObjectPageService);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const navNodeInfoResource = useService(NavNodeInfoResource);

  const state = useObservableRef(() => ({
    connecting: false,
    notFound: false,
  }), {
    connecting: observable.ref,
    notFound: observable.ref,
  }, false);

  const connection = useMapResource(ConnectionInfoResource, tab.handlerState.connectionId || null, {
    isActive: resource => !tab.handlerState.connectionId || !resource.has(tab.handlerState.connectionId),
  });

  const children = useMapResource(NavTreeResource, tab.handlerState.parentId, {
    onLoad: async resource => {
      if (tab.handlerState.parents.length === 0) {
        return true;
      }

      const first = tab.handlerState.parents[0];
      await resource.load(first);

      for (const nodeId of tab.handlerState.parents) {
        if (!navNodeInfoResource.has(nodeId)) {
          state.notFound = true;
          return true;
        }
        await resource.load(nodeId);
      }
      state.notFound = false;
      return false;
    },
    isActive: () => connection.data?.connected || false,
  });

  const dataPreloaded = children.isLoaded() && !!children.data?.includes(tab.handlerState.objectId) && !state.notFound;

  const node = useMapResource(navNodeInfoResource, dataPreloaded ? tab.handlerState.objectId : null, {
    onData(data) {
      tab.handlerState.tabIcon = data.icon;
      tab.handlerState.tabTitle = data.name;
    },
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
