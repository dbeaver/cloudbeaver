/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Children, forwardRef } from 'react';
import { Menu as UIKitMenu, useMenuStore, useStoreState, type MenuProps } from '@dbeaver/ui-kit';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { getComputed } from '../getComputed.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { MenuEmptyItem } from './MenuEmptyItem.js';
import style from './MenuPanel.module.css';
import styleMenuItemElement from './MenuItemElement.module.css';

export interface IMenuPanelProps extends MenuProps {
  label: string;
  menu: ReturnType<typeof useMenuStore>;
  modal?: boolean;
  panelAvailable?: boolean;
  hasBindings?: boolean;
  getHasBindings?: () => boolean;
  rtl?: boolean;
  submenu?: boolean;
  className?: string;
}

export const MenuPanel = observer<IMenuPanelProps, HTMLDivElement>(
  forwardRef(function MenuPanel(
    { label, menu, submenu, modal, panelAvailable = true, rtl, getHasBindings, hasBindings, children, className, ...rest },
    ref,
  ) {
    const translate = useTranslate();
    const styles = useS(style, styleMenuItemElement);
    const menuState = useStoreState(menu);
    const visible = !!menuState.open;

    if (!visible) {
      return null;
    }

    hasBindings = panelAvailable && (hasBindings || getComputed(() => getHasBindings?.()));

    return (
      <ErrorBoundary>
        <UIKitMenu
          ref={ref}
          store={menu}
          modal={modal}
          className={s(styles, { menu: true, modal, submenu }, className)}
          aria-label={translate(label)}
          {...rest}
        >
          <div dir={rtl ? 'rtl' : undefined} data-s-has-bindings={hasBindings} className={s(styles, { menuBox: true })}>
            {Children.count(children) === 0 && <MenuEmptyItem />}
            {children}
          </div>
        </UIKitMenu>
      </ErrorBoundary>
    );
  }),
);
