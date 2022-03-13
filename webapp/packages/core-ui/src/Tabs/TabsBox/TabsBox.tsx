/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren, ReactNode, forwardRef } from 'react';
import styled, { css } from 'reshadow';

import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import { TabsState } from '../TabsState';

const styles = css`
  tabs-box {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: hidden;
  }
  tabs {
    display: flex;
    flex-direction: row;
    flex: 0 0 auto;
    overflow: auto;
  }
  tab-panels {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  tab-panel {
    flex: 1;
    display: flex;
    overflow: hidden;
    outline: none;
    position: relative;
  }
`;

type TabsBoxProps = PropsWithChildren<{
  currentTabId: string;
  tabs?: ReactNode;
  tabIndex?: number;
  localState?: MetadataMap<string, any>;
  tabList?: string[];
  enabledBaseActions?: boolean;
  className?: string;
  style?: ComponentStyle;
}>;

export const TabsBox = forwardRef<HTMLDivElement, TabsBoxProps>(function TabsBox({
  currentTabId,
  tabs,
  tabIndex,
  localState,
  tabList,
  enabledBaseActions,
  children,
  className,
  style,
}, ref) {
  return styled(styles, useStyles(style))(
    <TabsState
      currentTabId={currentTabId}
      localState={localState}
      tabList={tabList}
      enabledBaseActions={enabledBaseActions}
    >
      <tabs-box ref={ref} as="div" className={className} tabIndex={tabIndex}>
        {tabs && <tabs>{tabs}</tabs>}
        <tab-panels>
          {children}
        </tab-panels>
      </tabs-box>
    </TabsState>
  );
});
