/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Children, forwardRef } from 'react';
import { Menu, MenuStateReturn } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { ErrorBoundary } from '../ErrorBoundary';
import { getComputed } from '../getComputed';
import { useStyles } from '../useStyles';
import { MenuEmptyItem } from './MenuEmptyItem';
import { menuPanelStyles } from './menuPanelStyles';


export interface IMenuPanelProps {
  label: string;
  menu: MenuStateReturn; // from reakit useMenuState
  panelAvailable?: boolean;
  hasBindings?: boolean;
  getHasBindings?: () => boolean;
  children: React.ReactNode | (() => React.ReactNode);
  rtl?: boolean;
  submenu?: boolean;
  style?: ComponentStyle;
  className?: string;
}

export const MenuPanel = observer<IMenuPanelProps, HTMLDivElement>(forwardRef(function MenuPanel({
  label,
  menu,
  panelAvailable = true,
  rtl,
  getHasBindings,
  hasBindings,
  children,
  style,
  className,
}, ref) {
  const styles = useStyles(menuPanelStyles, style);
  const visible = menu.visible;

  if (!visible) {
    return null;
  }

  hasBindings = panelAvailable && (hasBindings || getComputed(() => getHasBindings?.()));

  let renderedChildren: React.ReactNode = <></>;

  if (panelAvailable) {
    renderedChildren = typeof children === 'function'
      ? children()
      : children;
  }

  return styled(styles)(
    <ErrorBoundary>
      <Menu ref={ref} {...menu} aria-label={label} className={className} visible={panelAvailable}>
        <menu-box dir={rtl ? 'rtl' : undefined} {...use({ hasBindings })}>
          {Children.count(renderedChildren) === 0 && (
            <MenuEmptyItem style={style} />
          )}
          {renderedChildren}
        </menu-box>
      </Menu>
    </ErrorBoundary>
  );
}));