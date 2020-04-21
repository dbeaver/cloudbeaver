/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  useMemo, PropsWithChildren, ReactNode, useEffect,
} from 'react';
import { useTabState } from 'reakit/Tab';
import styled from 'reshadow';

import { useStyles, Style } from '@dbeaver/core/theming';

import { TabsContext } from '../TabsContext';

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
  const state = useTabState({
    selectedId: currentTabId,
    manual: true,
  });
  state.selectedId = currentTabId;
  useEffect(() => state.select(currentTabId), [currentTabId]); // hack currentId and selectedId not works
  const value = useMemo(() => state, Object.values(state));

  return styled(useStyles(...style))(
    <TabsContext.Provider value={value}>
      <tabs-box as="div" className={className}>
        {tabs && (
          <tabs as="div">
            {tabs}
            <tab-fill as="div" />
          </tabs>
        )}
        <tab-panels as="div">
          {children}
        </tab-panels>
      </tabs-box>
    </TabsContext.Provider>
  );
}
