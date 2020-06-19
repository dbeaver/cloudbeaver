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
import { Tab } from '../Tab/Tab';
import { TabIcon } from '../Tab/TabIcon';
import { TabTitle } from '../Tab/TabTitle';
import { verticalTabStyles } from './verticalTabStyles';

type VerticalTabHeaderProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> & {
  tab: ITab;
  style: Style[];
}

export const VerticalTabHeader = observer(function VerticalTabHeader({ tab, style, ...props }: VerticalTabHeaderProps) {

  return styled(useStyles(verticalTabStyles, ...style))(
    <Tab
      tabId={tab.tabId}
      onOpen={tab.onActivate}
      onClose={tab.onClose}
      {...props}
    >
      {tab.icon && <TabIcon icon={tab.icon} />}
      <TabTitle>{tab.title}</TabTitle>
    </Tab>
  );
});
