/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { useChildren, TabHandlerPanelProps, NavigationTabsService } from '@cloudbeaver/core-app';
import {
  Loader, TabsBox, TabPanel, TextPlaceholder, Button
} from '@cloudbeaver/core-blocks';
import { useConnectionInfo } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { IObjectViewerTabState } from './IObjectViewerTabState';
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
  const connection = useConnectionInfo(tab.handlerState.connectionId || '');
  const navigation = useService(NavigationTabsService);
  const style = useStyles(styles);
  const {
    children, isOutdated, isLoading, isLoaded,
  } = useChildren(tab.handlerState.objectId);
  const dbObjectPagesService = useService(DBObjectPageService);
  const pages = dbObjectPagesService.orderedPages;

  const handleConnect = useCallback(async () => {
    await connection.connect();
    navigation.selectTab(tab.id);
  }, [navigation, connection, tab]);

  if (connection.connectionInfo && !connection.connectionInfo.connected && !connection.isLoading()) {
    return (
      <TextPlaceholder>
        <Button type="button" mod={['unelevated']} onClick={handleConnect}>{translate('connections_connection_connect')}</Button>
      </TextPlaceholder>
    );
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
        <TabPanel key={page.key} tabId={page.key}>
          <DBObjectPagePanel tab={tab} page={page} />
        </TabPanel>
      ))}
    </TabsBox>
  );
});
