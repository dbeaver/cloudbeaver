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

import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';

import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { DataPresentationComponent } from '../../DataPresentationService';
import { DataValuePanelService } from './DataValuePanelService';

const styles = css`
    table-left-bar {
      display: flex;
    }
    Tab {
      composes: theme-ripple from theme-typography--body2 from global;
      text-transform: uppercase;
      font-weight: normal;

      &:global([aria-selected=true]) {
        font-weight: normal !important;
      }
    }
    TabList {
      composes: theme-border-color-background from global;
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
    TabList, TabPanel {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `;

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

  return styled(useStyles(BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES))(
    <TabsState
      currentTabId={currentTabId}
      container={service.tabs}
      dataFormat={dataFormat}
      model={model}
      resultIndex={resultIndex}
      lazy
      onChange={tab => setCurrentTabId(tab.tabId)}
    >
      <TabList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
      <TabPanelList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
    </TabsState>
  );
});
