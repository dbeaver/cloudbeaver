/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';
import styled, { css } from 'reshadow';

import { TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { DataPresentationComponent } from '../../DataPresentationService';
import { DataValuePanelService } from './DataValuePanelService';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple from global;
    }
    TabList {
      composes: theme-border-color-background from global;
    }
    TabList, TabPanel {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    table-left-bar {
      display: flex;
    }
    Tab {
      composes: theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }
    }
    TabList {
      position: relative;
      
      &:before {
        content: '';
        position: absolute;
        bottom: 0;
        width: 100%;
        border-bottom: solid 2px;
        border-color: inherit;
      }
    }
    TabList tab-outer:only-child {
      display: none;
    }
    TabPanel {
      padding: 16px;
    }
  `
);

export const ValuePanel: DataPresentationComponent<any, IDatabaseResultSet> = observer(function ValuePanel({
  dataFormat,
  model,
  resultIndex,
}) {
  const service = useService(DataValuePanelService);
  const [currentTabId, setCurrentTabId] = useState('');
  const lastTabId = useRef('');

  const displayed = service.getDisplayed({ dataFormat, model, resultIndex });

  if (displayed.length > 0) {
    const firstTabId = displayed[0].key;
    if (firstTabId !== lastTabId.current) {
      setCurrentTabId(firstTabId);
      lastTabId.current = firstTabId;
    }
  }

  return styled(useStyles(styles, UNDERLINE_TAB_STYLES))(
    <TabsState
      currentTabId={currentTabId}
      container={service.tabs}
      dataFormat={dataFormat}
      model={model}
      resultIndex={resultIndex}
      lazy
      onChange={tab => setCurrentTabId(tab.tabId)}
    >
      <TabList style={[styles, UNDERLINE_TAB_STYLES]} />
      <TabPanelList style={[styles, UNDERLINE_TAB_STYLES]} />
    </TabsState>
  );
});
