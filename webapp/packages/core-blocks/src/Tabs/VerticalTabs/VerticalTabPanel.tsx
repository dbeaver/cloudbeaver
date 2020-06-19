/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import { useStyles, Style } from '@cloudbeaver/core-theming';

import { ITab } from '../ITab';
import { TabPanel } from '../TabPanel';
import { verticalTabStyles } from './verticalTabStyles';

type VerticalTabPanelProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
  tab: ITab;
  style: Style[];
}

export const VerticalTabPanel = observer(function VerticalTabPanel({ tab, style }: VerticalTabPanelProps) {
  const Panel = tab.panel;

  return styled(useStyles(verticalTabStyles, ...style))(
    <TabPanel tabId={tab.tabId}>
      <Panel/>
    </TabPanel>
  );
});
