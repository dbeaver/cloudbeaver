/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { forwardRef, useEffect, useLayoutEffect, useRef } from 'react';
import { MenuButton, MenuInitialState, useMenuState } from 'reakit/Menu';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { ErrorBoundary } from '../ErrorBoundary';
import { useObjectRef } from '../useObjectRef';
import { useStyles } from '../useStyles';
import { MenuPanel } from './MenuPanel';
import { menuPanelStyles } from './menuPanelStyles';
import { IMenuState, MenuStateContext } from './MenuStateContext';
import type { IMouseContextMenu } from './useMouseContextMenu';

interface IMenuProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  mouseContextMenu?: IMouseContextMenu;
  label: string;
  items: React.ReactNode | (() => React.ReactNode);
  menuRef?: React.RefObject<IMenuState | undefined>;
  style?: ComponentStyle;
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

export const Menu = observer<IMenuProps, HTMLButtonElement>(forwardRef(function Menu({
  mouseContextMenu,
  label,
  items,
  menuRef,
  disclosure,
  children,
  style,
  placement,
  visible,
  hasBindings,
  panelAvailable,
  getHasBindings,
  onVisibleSwitch,
  modal,
  submenu,
  rtl,
  ...props
}, ref) {
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const propsRef = useObjectRef({ onVisibleSwitch, visible });
  const menu = useMenuState({ modal, placement, visible, rtl });
  const styles = useStyles(menuPanelStyles, style);

  if (menuRef) {
  //@ts-expect-error Ref mutation
    menuRef.current = menu;
  }

  useEffect(() => {
    if (!menu.visible && mouseContextMenu) {
      mouseContextMenu.position = null;
    }

    propsRef.onVisibleSwitch?.(menu.visible);
  }, [menu.visible]);

  let menuVisible = menu.visible;

  if (panelAvailable === false) {
    menuVisible = false;
  }

  useLayoutEffect(() => {
    if (mouseContextMenu?.position) {
      menu.show();
    }
  }, [mouseContextMenu?.position]);

  useLayoutEffect(() => {
    if (mouseContextMenu?.position) {
      if (menuPanelRef.current) {
        menuPanelRef.current.style.transform = 'none';
        menuPanelRef.current.style.left = `${mouseContextMenu.position.x}px`;
        menuPanelRef.current.style.top = `${mouseContextMenu.position.y}px`;
      }
    }
  });

  if (React.isValidElement(children) && disclosure) {
    return styled(styles)(
      <ErrorBoundary>
        <MenuStateContext.Provider value={menu}>
          <MenuButton ref={ref} {...menu} visible={menuVisible} {...props} {...children.props}>
            {disclosureProps => React.cloneElement(children, { ...disclosureProps, ...children.props })}
          </MenuButton>
          <MenuPanel
            ref={menuPanelRef}
            label={label}
            menu={menu}
            style={style}
            rtl={rtl}
            submenu={submenu}
            panelAvailable={panelAvailable}
            hasBindings={hasBindings}
            getHasBindings={getHasBindings}
          >
            {items}
          </MenuPanel>
        </MenuStateContext.Provider>
      </ErrorBoundary>
    );
  }

  return styled(styles)(
    <ErrorBoundary>
      <MenuStateContext.Provider value={menu}>
        <MenuButton ref={ref} {...menu} visible={menuVisible} {...props}>
          <box>{children}</box>
        </MenuButton>
        <MenuPanel
          ref={menuPanelRef}
          label={label}
          menu={menu}
          style={style}
          rtl={rtl}
          submenu={submenu}
          panelAvailable={panelAvailable}
          hasBindings={hasBindings}
          getHasBindings={getHasBindings}
        >
          {items}
        </MenuPanel>
      </MenuStateContext.Provider>
    </ErrorBoundary>
  );
}));