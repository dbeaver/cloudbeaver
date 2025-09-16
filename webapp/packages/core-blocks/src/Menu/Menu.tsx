/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useLayoutEffect, useRef } from 'react';
import { Menu as UIKitMenu, useMenuStore, useStoreState, type MenuProviderProps } from '@dbeaver/ui-kit';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { s } from '../s.js';
import { useCombinedRef } from '../useCombinedRef.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import style from './Menu.module.css';
import { MenuPanel } from './MenuPanel.js';
import type { IContextMenuPosition } from './useContextMenuPosition.js';

interface IMenuProps extends React.ButtonHTMLAttributes<any> {
  contextMenuPosition?: IContextMenuPosition;
  label: string;
  items: React.ReactNode;
  disclosure?: boolean;
  placement?: MenuProviderProps['placement'];
  submenu?: boolean;
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  hasBindings?: boolean;
  panelAvailable?: boolean;
  getHasBindings?: () => boolean;
  onVisibleSwitch?: (visible: boolean) => void;
}

export const Menu = observer<IMenuProps, HTMLButtonElement>(
  forwardRef(function Menu(
    {
      contextMenuPosition,
      label,
      items,
      disclosure,
      children,
      placement,
      visible,
      hasBindings,
      panelAvailable,
      getHasBindings,
      onVisibleSwitch,
      modal,
      submenu,
      rtl,
      className,
      ...props
    },
    ref,
  ) {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const combinedRef = useCombinedRef(ref, buttonRef);
    const menuRef = useRef<HTMLDivElement>(null);
    const propsRef = useObjectRef({ onVisibleSwitch, visible });
    const store = useMenuStore({
      placement,
      defaultOpen: visible,
    });
    const storeState = useStoreState(store);
    const styles = useS(style);

    let menuVisible = !!storeState.open;

    if (panelAvailable === false) {
      menuVisible = false;
    }

    useLayoutEffect(() => {
      propsRef.onVisibleSwitch?.(menuVisible);
    }, [menuVisible]);

    function getAnchorRect() {
      if (contextMenuPosition?.position) {
        return () => contextMenuPosition.position;
      }

      return undefined;
    }

    if (React.isValidElement(children) && disclosure) {
      return (
        <ErrorBoundary>
          <UIKitMenu.Button
            ref={combinedRef}
            store={store}
            tabIndex={0}
            className={s(styles, { menuButton: true }, className)}
            {...props}
            {...(children.props as any)}
          >
            {React.cloneElement(children, { ...(children.props as any) })}
          </UIKitMenu.Button>
          <MenuPanel
            ref={menuRef}
            modal={modal}
            label={label}
            menu={store}
            rtl={rtl}
            submenu={submenu}
            getAnchorRect={getAnchorRect()}
            panelAvailable={panelAvailable}
            hasBindings={hasBindings}
            getHasBindings={getHasBindings}
          >
            {items}
          </MenuPanel>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <UIKitMenu.Button ref={combinedRef} store={store} tabIndex={0} className={s(styles, { menuButton: true }, className)} {...props}>
          <div className={s(styles, { box: true }, className)}>{children}</div>
        </UIKitMenu.Button>
        <MenuPanel
          ref={menuRef}
          modal={modal}
          label={label}
          menu={store}
          rtl={rtl}
          submenu={submenu}
          getAnchorRect={getAnchorRect()}
          panelAvailable={panelAvailable}
          hasBindings={hasBindings}
          getHasBindings={getHasBindings}
        >
          {items}
        </MenuPanel>
      </ErrorBoundary>
    );
  }),
);
