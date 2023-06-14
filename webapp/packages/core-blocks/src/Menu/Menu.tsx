/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useLayoutEffect, useRef, useState } from 'react';
import { MenuButton, MenuInitialState, useMenuState } from 'reakit/Menu';
import styled from 'reshadow';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { ErrorBoundary } from '../ErrorBoundary';
import { useCombinedRef } from '../useCombinedRef';
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

export const Menu = observer<IMenuProps, HTMLButtonElement>(
  forwardRef(function Menu(
    {
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
    const styles = useStyles(menuPanelStyles, style);

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
      return styled(styles)(
        <ErrorBoundary>
          <MenuStateContext.Provider value={menu}>
            <MenuButton key={relativePosition ? 'link' : 'main'} ref={combinedRef} {...menu} visible={menuVisible} {...props} {...children.props}>
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
            {relativePosition && <MenuButtonLink ref={menuButtonLinkRef} {...menu} visible={menuVisible} />}
          </MenuStateContext.Provider>
        </ErrorBoundary>,
      );
    }

    return styled(styles)(
      <ErrorBoundary>
        <MenuStateContext.Provider value={menu}>
          <MenuButton key={relativePosition ? 'link' : 'main'} ref={combinedRef} {...menu} visible={menuVisible} {...props}>
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
          {relativePosition && <MenuButtonLink ref={menuButtonLinkRef} {...menu} visible={menuVisible} />}
        </MenuStateContext.Provider>
      </ErrorBoundary>,
    );
  }),
);
