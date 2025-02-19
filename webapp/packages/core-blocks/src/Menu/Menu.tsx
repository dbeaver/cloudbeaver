/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { MenuButton, type MenuInitialState, useMenuState } from 'reakit';
import type { ExtractHTMLAttributes } from 'reakit-utils';

import { ErrorBoundary } from '../ErrorBoundary.js';
import { s } from '../s.js';
import { useCombinedRef } from '../useCombinedRef.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import style from './Menu.module.css';
import { MenuPanel } from './MenuPanel.js';
import { type IMenuState, MenuStateContext } from './MenuStateContext.js';
import type { IContextMenuPosition } from './useContextMenuPosition.js';

interface IMenuProps extends React.ButtonHTMLAttributes<any> {
  contextMenuPosition?: IContextMenuPosition;
  label: string;
  items: React.ReactNode | (() => React.ReactNode);
  menuRef?: React.RefObject<IMenuState | null>;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
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
      menuRef,
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
    const innerMenuButtonRef = useRef<HTMLButtonElement>(null);
    const combinedRef = useCombinedRef(ref, innerMenuButtonRef);
    const [relativePosition, setRelativePosition] = useState<{ x: number; y: number } | null>(null);
    const menuButtonLinkRef = useRef<HTMLButtonElement>(null);
    const menuPanelRef = useRef<HTMLDivElement>(null);
    const propsRef = useObjectRef({ onVisibleSwitch, visible });
    const menu = useMenuState({
      modal,
      placement,
      visible,
      rtl,
      unstable_fixed: true,
    });
    const styles = useS(style);

    if (menuRef) {
      menuRef.current = menu;
    }

    let menuVisible = menu.visible;

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
        menu.hide();
        return;
      }

      if (innerMenuButtonRef.current) {
        menu.show();

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

    const MenuButtonLink = MenuButton;

    if (React.isValidElement(children) && disclosure) {
      return (
        <ErrorBoundary>
          <MenuStateContext.Provider value={menu}>
            <MenuButton
              key={relativePosition ? 'link' : 'main'}
              ref={combinedRef}
              tabIndex={0}
              className={s(styles, { menuButton: true }, className)}
              {...menu}
              visible={menuVisible}
              {...props}
              {...(children.props as any)}
            >
              {(disclosureProps: ExtractHTMLAttributes<any>) => React.cloneElement(children, { ...disclosureProps, ...(children.props as any) })}
            </MenuButton>
            <MenuPanel
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
            {relativePosition && (
              <MenuButtonLink ref={menuButtonLinkRef} className={s(styles, { menuButtonLink: true })} {...menu} visible={menuVisible} />
            )}
          </MenuStateContext.Provider>
        </ErrorBoundary>
      );
    }

    return (
      <ErrorBoundary>
        <MenuStateContext.Provider value={menu}>
          <MenuButton
            key={relativePosition ? 'link' : 'main'}
            ref={combinedRef}
            tabIndex={0}
            className={s(styles, { menuButton: true }, className)}
            {...menu}
            visible={menuVisible}
            {...props}
          >
            <div className={s(styles, { box: true }, className)}>{children}</div>
          </MenuButton>
          <MenuPanel
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
          {relativePosition && (
            <MenuButtonLink ref={menuButtonLinkRef} className={s(styles, { menuButtonLink: true })} {...menu} visible={menuVisible} />
          )}
        </MenuStateContext.Provider>
      </ErrorBoundary>
    );
  }),
);
