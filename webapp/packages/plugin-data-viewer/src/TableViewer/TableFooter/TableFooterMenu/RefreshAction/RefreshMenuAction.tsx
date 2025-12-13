/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useEffect } from 'react';

import { type CRegistryList, type IComponentsTreeNodeValidator, TimerIcon, useParentProps } from '@cloudbeaver/core-blocks';
import { MenuBarItem, type MenuBarItemProps, MenuActionElement } from '@cloudbeaver/core-ui';
import { ACTION_REFRESH } from '@cloudbeaver/core-view';

import { getRefreshState } from './getRefreshState.js';

const RefreshMenuItem: typeof MenuBarItem = observer<MenuBarItemProps, HTMLButtonElement>(
  forwardRef(function RefreshMenuItem(props, ref) {
    const actionProps = useParentProps(MenuActionElement);
    const refreshAction = actionProps ? getRefreshState(actionProps.menuData.context) : undefined;

    useEffect(() => {
      refreshAction?.resume();

      return () => {
        refreshAction?.pause();
      };
    }, [refreshAction]);

    if (!actionProps || !refreshAction) {
      return <MenuBarItem {...props} ref={ref} icon={<TimerIcon state="stop" interval="?" />} />;
    }

    let interval: number | string = Math.round(refreshAction.interval / 1000);

    if (interval > 99) {
      interval = '99+';
    }

    return <MenuBarItem {...props} ref={ref} icon={<TimerIcon state="stop" interval={interval} />} />;
  }),
);

export const REFRESH_MENU_ITEM_REGISTRY: CRegistryList = [
  [
    MenuBarItem,
    [
      {
        component: MenuActionElement,
        validator({ item, menuData }) {
          if (item.action.action !== ACTION_REFRESH) {
            return false;
          }
          const state = getRefreshState(menuData.context);

          return !!state?.isAutoRefresh;
        },
      } as IComponentsTreeNodeValidator<typeof MenuActionElement>,
      {
        component: MenuBarItem,
        replacement: RefreshMenuItem,
        validator(props) {
          return typeof props.icon === 'string';
        },
      } as IComponentsTreeNodeValidator<typeof MenuBarItem>,
    ],
  ],
];
