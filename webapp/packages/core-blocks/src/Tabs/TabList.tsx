/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';
import { TabList as BaseTabList, TabListOptions, TabStateReturn } from 'reakit/Tab';

import { DynamicStyle } from '@cloudbeaver/core-theming';

import { TabDefault } from './Tab/TabDefault';
import { TabsContext } from './TabsContext';

type Props = React.PropsWithChildren<Omit<TabListOptions, keyof TabStateReturn>> & {
  style?: DynamicStyle[] | DynamicStyle;
};

export const TabList: React.FC<Props> = function TabList({
  style,
  children,
  ...props
}) {
  const state = useContext(TabsContext);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  if (state.container) {
    return (
      <BaseTabList {...props} {...state.state}>
        {state.container.tabInfoList.map(tabInfo => (
          <TabDefault
            key={tabInfo.key}
            tabId={tabInfo.key}
            name={tabInfo.name}
            icon={tabInfo.icon}
            component={tabInfo.tab?.()}
            {...state.props}
            style={style}
            onOpen={tabInfo.onOpen}
            onClose={tabInfo.onClose}
          />
        ))}
        {children}
      </BaseTabList>
    );
  }

  return <BaseTabList {...props} {...state.state}>{children}</BaseTabList>;
};
