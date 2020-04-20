/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { composes, useStyles } from '@dbeaver/core/theming';

import { ITab } from '../ITab';
import { TabPanel } from '../TabPanel';

const styles = composes(
  css`
    TabPanel {
      composes: theme-border-color-background from global;
    }
  `,
  css`
    TabPanel {
      outline: none;
      overflow: auto !important;
      border-top: 1px solid;
    }
  `,
);

type VerticalTabPanelProps = React.HTMLAttributes<HTMLDivElement> & {
  tab: ITab;
}

export const VerticalTabPanel = observer(function VerticalTabPanel({ tab }: VerticalTabPanelProps) {
  const Panel = tab.panel;

  return styled(useStyles(styles))(
    <TabPanel tabId={tab.tabId}>
      <Panel/>
    </TabPanel>
  );
});
