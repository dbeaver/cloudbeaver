/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { baseTabStyles, TabList, TabsState, underlineTabStyles } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { DatabaseDataResultAction } from '../../DatabaseDataModel/Actions/DatabaseDataResultAction';
import { DatabaseMetadataAction } from '../../DatabaseDataModel/Actions/DatabaseMetadataAction';
import { DatabaseSelectAction } from '../../DatabaseDataModel/Actions/DatabaseSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { DataPresentationComponent } from '../../DataPresentationService';
import { DataValuePanelService } from './DataValuePanelService';
import styles from './ValuePanel.m.css';
import { ValuePanelEditorTabs } from './ValuePanelEditorTabs';

const tabListRegistry: StyleRegistry = [[baseTabStyles, { mode: 'append', styles: [underlineTabStyles, styles] }]];

export const ValuePanel: DataPresentationComponent<any, IDatabaseResultSet> = observer(function ValuePanel({ dataFormat, model, resultIndex }) {
  const service = useService(DataValuePanelService);
  const selectAction = model.source.getActionImplementation(resultIndex, DatabaseSelectAction);
  const dataResultAction = model.source.getActionImplementation(resultIndex, DatabaseDataResultAction);
  const metadataAction = model.source.getAction(resultIndex, DatabaseMetadataAction);
  const activeElements = selectAction?.getActiveElements();
  let elementKey: string | null = null;
  const style = useS(styles);

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

  const hasCurrentTabCells = currentTabId && displayed.some(tab => tab.key === currentTabId);

  if (displayed.length > 0 && !hasCurrentTabCells) {
    currentTabId = displayed[0].key;
  }

  return (
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
      <SContext registry={tabListRegistry}>
        <TabList className={s(style, { tabList: true })} />
      </SContext>
      <ValuePanelEditorTabs />
    </TabsState>
  );
});
