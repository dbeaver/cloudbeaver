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

import { tabPanelStyles, tabsBoxStyles } from '../..';
import type { ITabData } from '../TabsContainer/ITabsContainer';
import { TabsState } from '../TabsState';

const tabsBoxRegistry: StyleRegistry = [
  [
    tabPanelStyles,
    {
      mode: 'append',
      styles: [tabsBoxStyles],
    },
  ],
];

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string | null;
  tabs?: ReactNode;
  tabIndex?: number;
  localState?: MetadataMap<string, any>;
  tabList?: string[];
  enabledBaseActions?: boolean;
  autoSelect?: boolean;
  className?: string;
  onChange?: (tab: ITabData<any>) => void;
}>;

export const TabsBox = forwardRef<HTMLDivElement, TabsBoxProps>(function TabsBox(
  { currentTabId, tabs, tabIndex, localState, tabList, enabledBaseActions, autoSelect, children, className, onChange },
  ref,
) {
  const moduleStyles = useS(tabsBoxStyles);

  return (
    <TabsState
      currentTabId={currentTabId}
      localState={localState}
      tabList={tabList}
      autoSelect={autoSelect}
      enabledBaseActions={enabledBaseActions}
      onChange={onChange}
    >
      <SContext registry={tabsBoxRegistry}>
        <div ref={ref} className={s(moduleStyles, { tabsBox: true }, className)} tabIndex={tabIndex}>
          {tabs && <div className={s(moduleStyles, { tabs: true })}>{tabs}</div>}
          <div className={s(moduleStyles, { tabPanels: true })}>{children}</div>
        </div>
      </SContext>
    </TabsState>
  );
});
