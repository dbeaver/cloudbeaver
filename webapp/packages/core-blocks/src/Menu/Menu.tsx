/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
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
  items: React.ReactNode | (() => React.ReactNode);
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

export const Menu = observer<IMenuProps, HTMLDivElement>(
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
    const innerMenuButtonRef = useRef<HTMLDivElement>(null);
    const combinedRef = useCombinedRef(ref, innerMenuButtonRef);
    const [relativePosition, setRelativePosition] = useState<{ x: number; y: number } | null>(null);
    const menuButtonLinkRef = useRef<HTMLDivElement>(null);
    const menuPanelRef = useRef<HTMLDivElement>(null);
    const propsRef = useObjectRef({ onVisibleSwitch, visible });
    const menu = useMenuStore({
      placement,
      defaultOpen: visible,
    });
    const storeState = useStoreState(menu);
    const styles = useS(style);

    let menuVisible = !!storeState.open;

    if (panelAvailable === false) {
      menuVisible = false;
    }

    useLayoutEffect(() => {
      if (!menuVisible) {
        setRelativePosition(null);
      }

      propsRef.onVisibleSwitch?.(menuVisible);
    }, [menuVisible]);

    useLayoutEffect(() => {
      if (!contextMenuPosition?.position) {
        return;
      }

      if (menuVisible) {
        menu.setOpen(false);
        return;
      }

      if (innerMenuButtonRef.current) {
        menu.setOpen(true);

        const boxSize = innerMenuButtonRef.current.getBoundingClientRect();
        setRelativePosition({
          x: contextMenuPosition.position.x - boxSize.x,
          y: contextMenuPosition.position.y - boxSize.y,
        });

        contextMenuPosition.position = null;
      }
    }, [contextMenuPosition?.position, menuVisible]);

    useLayoutEffect(() => {
      if (relativePosition) {
        if (menuButtonLinkRef.current) {
          menuButtonLinkRef.current.style.left = `${relativePosition.x}px`;
          menuButtonLinkRef.current.style.top = `${relativePosition.y}px`;
        }
      }
    });

    const MenuButtonLink = 'div';

    if (React.isValidElement(children) && disclosure) {
      return (
        <ErrorBoundary>
          <UIKitMenu.Button
            store={menu}
            key={relativePosition ? 'link' : 'main'}
            ref={combinedRef}
            tabIndex={0}
            className={s(styles, { menuButton: true }, className)}
            {...props}
            {...(children.props as any)}
          >
            {React.cloneElement(children, { ...(children.props as any) })}
          </UIKitMenu.Button>
          <MenuPanel
            modal={modal}
            ref={menuPanelRef}
            label={label}
            menu={menu}
            rtl={rtl}
            submenu={submenu}
            panelAvailable={panelAvailable}
            hasBindings={hasBindings}
            getHasBindings={getHasBindings}
          >
            {items}
          </MenuPanel>
          {relativePosition && <MenuButtonLink ref={menuButtonLinkRef} className={s(styles, { menuButtonLink: true })} />}
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <UIKitMenu.Button
          store={menu}
          key={relativePosition ? 'link' : 'main'}
          ref={combinedRef}
          tabIndex={0}
          className={s(styles, { menuButton: true }, className)}
          {...props}
        >
          <div className={s(styles, { box: true }, className)}>{children}</div>
        </UIKitMenu.Button>
        <MenuPanel
          modal={modal}
          ref={menuPanelRef}
          label={label}
          menu={menu}
          rtl={rtl}
          submenu={submenu}
          panelAvailable={panelAvailable}
          hasBindings={hasBindings}
          getHasBindings={getHasBindings}
        >
          {items}
        </MenuPanel>
        {relativePosition && <MenuButtonLink ref={menuButtonLinkRef} className={s(styles, { menuButtonLink: true })} />}
      </ErrorBoundary>
    );
  }),
);
