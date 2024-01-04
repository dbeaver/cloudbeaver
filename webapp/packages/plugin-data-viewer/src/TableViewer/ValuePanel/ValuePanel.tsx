/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, UNDERLINE_TAB_STYLES } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { DatabaseDataResultAction } from '../../DatabaseDataModel/Actions/DatabaseDataResultAction';
import { DatabaseMetadataAction } from '../../DatabaseDataModel/Actions/DatabaseMetadataAction';
import { DatabaseSelectAction } from '../../DatabaseDataModel/Actions/DatabaseSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { DataPresentationComponent } from '../../DataPresentationService';
import { DataValuePanelService } from './DataValuePanelService';

const styles = css`
  table-left-bar {
    display: flex;
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
    padding-top: 8px;
  }
  TabList,
  TabPanel {
    composes: theme-background-secondary theme-text-on-secondary from global;
  }
`;

export const ValuePanel: DataPresentationComponent<any, IDatabaseResultSet> = observer(function ValuePanel({ dataFormat, model, resultIndex }) {
  const service = useService(DataValuePanelService);
  const selectAction = model.source.getActionImplementation(resultIndex, DatabaseSelectAction);
  const dataResultAction = model.source.getActionImplementation(resultIndex, DatabaseDataResultAction);
  const metadataAction = model.source.getAction(resultIndex, DatabaseMetadataAction);
  const activeElements = selectAction?.getActiveElements();
  let elementKey: string | null = null;

  if (dataResultAction && activeElements && activeElements.length > 0) {
    elementKey = dataResultAction.getIdentifier(activeElements[0]);
  }

  const state = metadataAction.get(`value-panel-${elementKey}`, () =>
    observable(
      {
        currentTabId: '',
        tabsState: new MetadataMap<string, any>(),
        setCurrentTabId(tabId: string) {
          this.currentTabId = tabId;
        },
      },
      { tabsState: false },
      {},
    ),
  );

  const displayed = service.getDisplayed({ dataFormat, model, resultIndex });
  let currentTabId = state.currentTabId;

  if (displayed.length > 0 && (!currentTabId || !displayed.some(tab => tab.key === currentTabId))) {
    currentTabId = displayed[0].key;
  }

  return styled(
    BASE_TAB_STYLES,
    styles,
    UNDERLINE_TAB_STYLES,
  )(
    <TabsState
      currentTabId={currentTabId}
      container={service.tabs}
      dataFormat={dataFormat}
      model={model}
      resultIndex={resultIndex}
      localState={state.tabsState}
      lazy
      onChange={tab => state.setCurrentTabId(tab.tabId)}
    >
      <TabList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
      <TabPanelList style={[BASE_TAB_STYLES, styles, UNDERLINE_TAB_STYLES]} />
    </TabsState>,
  );
});
