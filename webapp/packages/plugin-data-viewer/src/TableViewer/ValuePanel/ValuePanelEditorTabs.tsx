/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { SContext, StyleRegistry } from '@cloudbeaver/core-blocks';
import { baseTabStyles, TabPanelList, tabPanelStyles, underlineTabStyles } from '@cloudbeaver/core-ui';

import tabPanelRegistryStyles from './styles/ValuePanelEditorTabPanel.m.css';
import tabsRegistryStyles from './styles/ValuePanelEditorTabs.m.css';

const tabListPanelRegistry: StyleRegistry = [
  [baseTabStyles, { mode: 'append', styles: [underlineTabStyles, tabsRegistryStyles] }],
  [tabPanelStyles, { mode: 'append', styles: [tabPanelRegistryStyles] }],
];

export const ValuePanelEditorTabs = observer(function ValuePanelEditorTabs() {
  return (
    <SContext registry={tabListPanelRegistry}>
      <TabPanelList />
    </SContext>
  );
});
