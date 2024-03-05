/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { MenuButton, MenuInitialState, useMenuState } from 'reakit/Menu';

import { ErrorBoundary } from '../ErrorBoundary';
import { s } from '../s';
import { useCombinedRef } from '../useCombinedRef';
import { useObjectRef } from '../useObjectRef';
import { useS } from '../useS';
import style from './Menu.m.css';
import { MenuPanel } from './MenuPanel';
import { IMenuState, MenuStateContext } from './MenuStateContext';
import type { IMouseContextMenu } from './useMouseContextMenu';

interface IMenuProps extends React.ButtonHTMLAttributes<any> {
  mouseContextMenu?: IMouseContextMenu;
  label: string;
  items: React.ReactNode | (() => React.ReactNode);
  menuRef?: React.RefObject<IMenuState | undefined>;
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
      mouseContextMenu,
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
    });
    const styles = useS(style);

    if (menuRef) {
      //@ts-expect-error Ref mutation
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
      if (!mouseContextMenu?.position) {
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
          x: mouseContextMenu.position.x - boxSize.x,
          y: mouseContextMenu.position.y - boxSize.y,
        });

        mouseContextMenu.position = null;
      }
    }, [mouseContextMenu?.position, menuVisible]);

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
              className={s(styles, { menuButton: true }, className)}
              {...menu}
              visible={menuVisible}
              {...props}
              {...children.props}
            >
              {disclosureProps => React.cloneElement(children, { ...disclosureProps, ...children.props })}
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
