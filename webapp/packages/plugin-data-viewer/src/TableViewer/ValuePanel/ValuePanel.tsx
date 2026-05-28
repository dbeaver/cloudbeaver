/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabList, TabPanelList, TabPanelStyles, TabsState, TabStyles } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { DataPresentationComponent } from '../../DataPresentationService.js';
import { DataValuePanelService } from './DataValuePanelService.js';
import styles from './shared/ValuePanel.module.css';
import ValuePanelEditorTabPanel from './shared/ValuePanelEditorTabPanel.module.css';
import ValuePanelEditorTabs from './shared/ValuePanelEditorTabs.module.css';
import ValuePanelTab from './shared/ValuePanelTab.module.css';
import { IDatabaseDataSelectAction } from '../../DatabaseDataModel/Actions/IDatabaseDataSelectAction.js';
import { IDatabaseDataResultAction } from '../../DatabaseDataModel/Actions/IDatabaseDataResultAction.js';
import { IDatabaseDataMetadataAction } from '../../DatabaseDataModel/Actions/IDatabaseDataMetadataAction.js';
import { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import type { IGridDataKey } from '../../DatabaseDataModel/Actions/Grid/IGridDataKey.js';
import { useContentType } from '../../ValuePanelPresentation/TextValue/useContentType.js';

const tabListRegistry: StyleRegistry = [[TabStyles, { mode: 'append', styles: [ValuePanelTab] }]];

const tabPanelListRegistry: StyleRegistry = [
  [TabStyles, { mode: 'append', styles: [ValuePanelEditorTabs] }],
  [TabPanelStyles, { mode: 'append', styles: [ValuePanelEditorTabPanel] }],
];

export const ValuePanel: DataPresentationComponent = observer(function ValuePanel({ dataFormat, model, resultIndex }) {
  const service = useService(DataValuePanelService);
  const selectAction = model.source.tryGetAction(resultIndex, IDatabaseDataSelectAction);
  const dataResultAction = model.source.tryGetAction(resultIndex, IDatabaseDataResultAction);
  const metadataAction = model.source.getAction(resultIndex, IDatabaseDataMetadataAction);
  const activeElements = selectAction?.getActiveElements() as IGridDataKey[] | undefined;
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

  const currentTabId = useContentType({
    model: model as any,
    currentContentType: state.currentTabId,
    elementKey: activeElements && activeElements.length > 0 ? activeElements[0] : undefined,
    formatAction: model.source.tryGetAction(resultIndex, IDatabaseDataFormatAction),
    displayed,
  });

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
        <TabList className={s(style, { tabList: true })} underline />
      </SContext>
      <SContext registry={tabPanelListRegistry}>
        <TabPanelList />
      </SContext>
    </TabsState>
  );
});
