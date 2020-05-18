/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren, ReactNode } from 'react';
import styled from 'reshadow';

import { useStyles, Style } from '@dbeaver/core/theming';

import { TabsState } from '../TabsState';

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string;
  tabs?: ReactNode;
  className?: string;
  style?: Style[];
}>

export function TabsBox({
  currentTabId,
  tabs,
  children,
  className,
  style = [],
}: TabsBoxProps) {

  return styled(useStyles(...style))(
    <TabsState currentTabId={currentTabId}>
      <tabs-box as="div" className={className}>
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
}
