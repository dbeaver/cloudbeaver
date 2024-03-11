/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef, PropsWithChildren, ReactNode } from 'react';

import { s, SContext, StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import tabPanelStyles from '../TabPanel.m.css';
import type { ITabData } from '../TabsContainer/ITabsContainer';
import { TabsState } from '../TabsState';
import styles from './TabsBox.m.css';

const tabsBoxRegistry: StyleRegistry = [
  [
    tabPanelStyles,
    {
      mode: 'append',
      styles: [styles],
    },
  ],
];

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string | null;
  tabs?: ReactNode;
  tabIndex?: number;
  localState?: MetadataMap<string, any>;
  tabList?: string[];
  tabsClassName?: string;
  enabledBaseActions?: boolean;
  autoSelect?: boolean;
  className?: string;
  onChange?: (tab: ITabData<any>) => void;
}>;

export const TabsBox = forwardRef<HTMLDivElement, TabsBoxProps>(function TabsBox(
  { currentTabId, tabs, tabIndex, localState, tabsClassName, tabList, enabledBaseActions, autoSelect, children, className, onChange },
  ref,
) {
  const style = useS(styles);

  return (
    <SContext registry={tabsBoxRegistry}>
      <TabsState
        currentTabId={currentTabId}
        localState={localState}
        tabList={tabList}
        autoSelect={autoSelect}
        enabledBaseActions={enabledBaseActions}
        onChange={onChange}
      >
        <div ref={ref} className={s(style, { tabsBox: true }, className)} tabIndex={tabIndex}>
          {tabs && <div className={s(style, { tabs: true }, tabsClassName)}>{tabs}</div>}
          <div className={s(style, { tabPanels: true })}>{children}</div>
        </div>
      </TabsState>
    </SContext>
  );
});
