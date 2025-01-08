/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Children, forwardRef } from 'react';
import { Menu, type MenuStateReturn } from 'reakit';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { getComputed } from '../getComputed.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { MenuEmptyItem } from './MenuEmptyItem.js';
import style from './MenuPanel.module.css';

export interface IMenuPanelProps {
  label: string;
  menu: MenuStateReturn; // from reakit useMenuState
  panelAvailable?: boolean;
  hasBindings?: boolean;
  getHasBindings?: () => boolean;
  children: React.ReactNode | (() => React.ReactNode);
  rtl?: boolean;
  submenu?: boolean;
  className?: string;
}

export const MenuPanel = observer<IMenuPanelProps, HTMLDivElement>(
  forwardRef(function MenuPanel({ label, menu, submenu, panelAvailable = true, rtl, getHasBindings, hasBindings, children, className }, ref) {
    const translate = useTranslate();
    const styles = useS(style);
    const visible = menu.visible;

    if (!visible) {
      return null;
    }

    hasBindings = panelAvailable && (hasBindings || getComputed(() => getHasBindings?.()));

    let renderedChildren: React.ReactNode = <></>;

    if (panelAvailable) {
      renderedChildren = typeof children === 'function' ? children() : children;
    }

    return (
      <ErrorBoundary>
        <Menu
          ref={ref}
          className={s(styles, { menu: true, modal: menu.modal, submenu }, className)}
          {...menu}
          aria-label={translate(label)}
          visible={panelAvailable}
        >
          <div dir={rtl ? 'rtl' : undefined} data-s-has-bindings={hasBindings} className={s(styles, { menuBox: true })}>
            {Children.count(renderedChildren) === 0 && <MenuEmptyItem />}
            {renderedChildren}
          </div>
        </Menu>
      </ErrorBoundary>
    );
  }),
);
