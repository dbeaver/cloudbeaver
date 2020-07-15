/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren, ReactNode, forwardRef } from 'react';
import styled from 'reshadow';

import { useStyles, Style } from '@cloudbeaver/core-theming';

import { TabsState } from '../TabsState';

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string;
  tabs?: ReactNode;
  tabIndex?: number;
  className?: string;
  style?: Style[];
}>

export const TabsBox = forwardRef<HTMLDivElement, TabsBoxProps>(function TabsBox({
  currentTabId,
  tabs,
  tabIndex,
  children,
  className,
  style = [],
}: TabsBoxProps, ref) {

  return styled(useStyles(...style))(
    <TabsState currentTabId={currentTabId}>
      <tabs-box as="div" className={className} ref={ref} tabIndex={tabIndex}>
        {tabs && (
          <tabs as="div">
            {tabs}
          </tabs>
        )}
        <tab-panels as="div">
          {children}
        </tab-panels>
      </tabs-box>
    </TabsState>
  );
});
