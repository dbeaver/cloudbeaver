/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef, type PropsWithChildren, type ReactNode } from 'react';

import { s, SContext, type StyleRegistry, useS } from '@cloudbeaver/core-blocks';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import tabPanelStyles from '../TabPanel.module.css';
import type { ITabData } from '../TabsContainer/ITabsContainer.js';
import { TabsState } from '../TabsState.js';
import styles from './shared/TabsBox.module.css';
import moduleTabPanelStyles from './shared/TabsBoxTabPanel.module.css';

const tabsBoxRegistry: StyleRegistry = [
  [
    tabPanelStyles,
    {
      mode: 'append',
      styles: [moduleTabPanelStyles],
    },
  ],
];

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string | null;
  tabs?: ReactNode;
  tabIndex?: number;
  localState?: MetadataMap<string, any>;
  tabList?: string[];
  multipleRows?: boolean;
  tabsClassName?: string;
  enabledBaseActions?: boolean;
  autoSelect?: boolean;
  className?: string;
  onChange?: (tab: ITabData<any>) => void;
}>;

/**
 * @deprecated
 */
export const TabsBox = forwardRef<HTMLDivElement, TabsBoxProps>(function TabsBox(
  { currentTabId, tabs, tabIndex, localState, tabsClassName, tabList, enabledBaseActions, autoSelect, children, className, onChange, multipleRows },
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
        <div ref={ref} className={s(style, { tabsBox: true }, className)} tabIndex={tabIndex ?? -1}>
          {tabs && <div className={s(style, { tabs: true, multipleRows }, tabsClassName)}>{tabs}</div>}
          <div className={s(style, { tabPanels: true })}>{children}</div>
        </div>
      </TabsState>
    </SContext>
  );
});
