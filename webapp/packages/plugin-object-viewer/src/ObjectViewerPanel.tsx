/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren, TabHandlerPanelProps } from '@cloudbeaver/core-app';
import {
  Loader, TabsBox, TabPanel, TextPlaceholder
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
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
  `,
);
const stylesArray = [styles];

export const ObjectViewerPanel = observer(function ObjectViewerPanel({
  tab, handler,
}: TabHandlerPanelProps<IObjectViewerTabState>) {
  const style = useStyles(styles);
  const {
    children, isOutdated, isLoading, isLoaded,
  } = useChildren(tab.handlerState.objectId);
  const dbObjectPagesService = useService(DBObjectPageService);
  const pages = dbObjectPagesService.orderedPages;

  if (!isLoaded || (!isOutdated && isLoading)) {
    return <Loader />;
  }

  if (!children) {
    return <TextPlaceholder>Nothing to show</TextPlaceholder>;
  }

  return styled(style)(
    <TabsBox
      currentTabId={tab.handlerState.pageId}
      tabs={pages.map(page => (
        <DBObjectPageTab
          key={page.key}
          tab={tab}
          page={page}
          onSelect={dbObjectPagesService.selectPage}
          style={stylesArray}
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
