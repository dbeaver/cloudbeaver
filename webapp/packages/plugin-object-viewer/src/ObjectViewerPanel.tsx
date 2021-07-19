/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { useChildren, TabHandlerPanelProps } from '@cloudbeaver/core-app';
import { Loader, TabsBox, TabPanel, TextPlaceholder, Button } from '@cloudbeaver/core-blocks';
import { useConnectionInfo } from '@cloudbeaver/core-connections';
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
  `
);
const stylesArray = [styles];

export const ObjectViewerPanel = observer(function ObjectViewerPanel({
  tab,
}: TabHandlerPanelProps<IObjectViewerTabState>) {
  const translate = useTranslate();
  const [connecting, setConnecting] = useState(false);
  const connection = useConnectionInfo(tab.handlerState.connectionId || '');
  const style = useStyles(styles);
  const {
    children, isOutdated, isLoading, isLoaded,
  } = useChildren(tab.handlerState.objectId);
  const dbObjectPagesService = useService(DBObjectPageService);
  const pages = dbObjectPagesService.orderedPages;

  const handleConnect = useCallback(async () => {
    setConnecting(true);
    try {
      await connection.connect();
    } finally {
      setConnecting(false);
    }
  }, [connection]);

  if (connection.connectionInfo && !connection.connectionInfo.connected) {
    if (connecting || connection.isLoading()) {
      return <Loader />;
    }

    return (
      <TextPlaceholder>
        <Button type="button" mod={['unelevated']} onClick={handleConnect}>{translate('connections_connection_connect')}</Button>
      </TextPlaceholder>
    );
  }

  if (tab.handlerState.error) {
    return <TextPlaceholder>{translate('plugin_object_viewer_error')}</TextPlaceholder>;
  }

  if (!isLoaded() || (!isOutdated() && isLoading())) {
    return <Loader />;
  }

  if (!children) {
    return <TextPlaceholder>{translate('plugin_object_viewer_table_no_items')}</TextPlaceholder>;
  }

  return styled(style)(
    <TabsBox
      currentTabId={tab.handlerState.pageId}
      tabs={pages.map(page => (
        <DBObjectPageTab
          key={page.key}
          tab={tab}
          page={page}
          style={stylesArray}
          onSelect={dbObjectPagesService.selectPage}
        />
      ))}
      style={stylesArray}
    >
      {pages.map(page => (
        <TabPanel key={page.key} tabId={page.key} lazy>
          <DBObjectPagePanel tab={tab} page={page} />
        </TabPanel>
      ))}
    </TabsBox>
  );
});
