/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useChildren, TabHandlerPanelProps } from '@dbeaver/core/app';
import { Loader, TabsBox, TabPanel } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { useStyles, composes } from '@dbeaver/core/theming';

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
    Tab:only-child {
      display: none;
    }
  `,
);
const stylesArray = [styles];

export const ObjectViewerPanel = observer(function ObjectViewerPanel({
  tab, handler,
}: TabHandlerPanelProps<IObjectViewerTabState>) {
  const children = useChildren(tab.handlerState.objectId);
  const dbObjectPagesService = useService(DBObjectPageService);
  const pages = dbObjectPagesService.orderedPages;

  if (!children?.isLoaded) {
    return <Loader />;
  }

  return styled(useStyles(styles))(
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
