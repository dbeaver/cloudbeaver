/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext, useMemo } from 'react';
import { TabList as BaseTabList, type TabListOptions, type TabStateReturn } from 'reakit';

import { s, SContext, type StyleRegistry, useS, useTranslate } from '@cloudbeaver/core-blocks';

import { generateTabElement } from './generateTabElement.js';
import { TabDefault } from './Tab/TabDefault.js';
import { TabBigUnderlineStyleRegistry, TabUnderlineStyleRegistry } from './Tab/TabStyleRegistries.js';
import styles from './TabList.module.css';
import { TabListVerticalRegistry, TabListVerticalRotatedRegistry } from './TabListStyleRegistries.js';
import verticalStyles from './TabListVertical.module.css';
import verticalRotatedStyles from './TabListVerticalRotated.module.css';
import { TabsContext } from './TabsContext.js';

export interface TabListProps extends Omit<TabListOptions, keyof TabStateReturn> {
  'aria-label'?: string;
  childrenFirst?: boolean;
  vertical?: boolean;
  rotated?: boolean;
  underline?: boolean;
  big?: boolean;
  className?: string;
}

export const TabList = observer<React.PropsWithChildren<TabListProps>>(function TabList({
  className,
  children,
  vertical,
  rotated,
  underline,
  big,
  childrenFirst,
  ...props
}) {
  const state = useContext(TabsContext);
  const translate = useTranslate();
  const componentStyle = useS(styles, !rotated && verticalStyles, verticalRotatedStyles);

  if (!state) {
    throw new Error('Tabs context was not provided');
  }

  const registry = useMemo<StyleRegistry>(
    () => [
      ...(vertical && !rotated ? TabListVerticalRegistry : []),
      ...(vertical && rotated ? TabListVerticalRotatedRegistry : []),
      ...(underline ? TabUnderlineStyleRegistry : []),
      ...(underline && big ? TabBigUnderlineStyleRegistry : []),
    ],
    [vertical, rotated, underline, big],
  );

  className = s(componentStyle, { tabList: true, vertical, rotated, underline, big }, className);

  if (state.container) {
    const displayed = state.container.getDisplayed(state.props);
    return (
      <SContext registry={registry}>
        <BaseTabList {...props} className={className} {...state.state} aria-label={translate(props['aria-label'] ?? state.container.areaLabel)}>
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
      </SContext>
    );
  }

  return (
    <SContext registry={registry}>
      <BaseTabList {...props} className={className} {...state.state} aria-label={translate(props['aria-label'])}>
        {children}
      </BaseTabList>
    </SContext>
  );
});
