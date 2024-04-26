/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { TabList as BaseTabList, TabListOptions, TabStateReturn } from 'reakit/Tab';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import { generateTabElement } from './generateTabElement';
import { TabDefault } from './Tab/TabDefault';
import styles from './TabList.m.css';
import { TabsContext } from './TabsContext';

export interface TabListProps extends Omit<TabListOptions, keyof TabStateReturn> {
  'aria-label'?: string;
  childrenFirst?: boolean;
  className?: string;
}

export const TabList = observer<React.PropsWithChildren<TabListProps>>(function TabList({ className, children, childrenFirst, ...props }) {
  const state = useContext(TabsContext);
  const translate = useTranslate();
  const componentStyle = useS(styles);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  if (state.container) {
    const displayed = state.container.getDisplayed(state.props);
    return (
      <BaseTabList
        {...props}
        className={s(componentStyle, { tabList: true }, className)}
        {...state.state}
        aria-label={translate(props['aria-label'] ?? state.container.areaLabel)}
      >
        {childrenFirst && children}
        {displayed
          .map(
            generateTabElement(
              (tabInfo, key) => (
                <TabDefault
                  key={key}
                  tabId={key}
                  name={tabInfo.name}
                  icon={tabInfo.icon}
                  component={tabInfo.tab?.()}
                  {...state.props}
                  aria-label={tabInfo.name}
                  disabled={props.disabled || tabInfo.isDisabled?.(tabInfo.key, state.props)}
                  onOpen={tabInfo.onOpen}
                  onClose={tabInfo.onClose}
                />
              ),
              state.props,
            ),
          )
          .flat()}
        {!childrenFirst && children}
      </BaseTabList>
    );
  }

  return (
    <BaseTabList {...props} className={s(componentStyle, { tabList: true }, className)} {...state.state} aria-label={translate(props['aria-label'])}>
      {children}
    </BaseTabList>
  );
});
