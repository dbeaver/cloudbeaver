/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { ButtonHTMLAttributes, forwardRef, useRef, useState } from 'react';
import type { MenuInitialState } from 'reakit/Menu';
import styled from 'reshadow';

import {
  getComputed,
  IMenuState,
  IMouseContextMenu,
  Menu,
  menuPanelStyles,
  useAutoLoad,
  useObjectRef,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { IMenuData, MenuActionItem } from '@cloudbeaver/core-view';

import { MenuItemRenderer } from './MenuItemRenderer';

interface IMenuProps extends React.PropsWithChildren {
  loading: boolean;
  disabled: boolean;
}

type ContextMenuRenderingChildren = (props: IMenuProps) => React.ReactNode | React.ReactElement;

interface IContextMenuProps extends Omit<ButtonHTMLAttributes<any>, 'style' | 'children'> {
  mouseContextMenu?: IMouseContextMenu;
  menu: IMenuData;
  style?: ComponentStyle;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  children?: React.ReactNode | ContextMenuRenderingChildren;
  onVisibleSwitch?: (visible: boolean) => void;
}

export const ContextMenu = observer<IContextMenuProps, HTMLButtonElement>(
  forwardRef(function ContextMenu(
    { mouseContextMenu, menu: menuData, disclosure, children, style, placement, visible, onVisibleSwitch, modal, rtl, ...props },
    ref,
  ) {
    const translate = useTranslate();
    const [menuVisible, setMenuVisible] = useState(false);

    const handler = menuData.handler;
    const hidden = getComputed(() => handler?.isHidden?.(menuData.context) || false);
    const loading = getComputed(() => handler?.isLoading?.(menuData.context) || menuData.loaders.some(loader => loader.isLoading()) || false);
    const disabled = getComputed(() => loading || handler?.isDisabled?.(menuData.context) || false);
    const lazy = getComputed(() => !menuData.available || hidden);

    const menu = useRef<IMenuState>();
    const styles = useStyles(menuPanelStyles, style);

    useAutoLoad(menuData.loaders, !lazy, menuVisible);

    const handlers = useObjectRef(
      () => ({
        handleItemClose() {
          menu.current?.hide();
        },
        hasBindings() {
          return this.menuData.items.some(item => item instanceof MenuActionItem && item.action.binding !== null);
        },
        handleVisibleSwitch(visible: boolean) {
          setMenuVisible(visible);
          this.onVisibleSwitch?.(visible);

          if (visible) {
            this.handler?.handler?.(this.menuData.context);
          }
        },
      }),
      { menuData, handler, onVisibleSwitch },
      ['handleItemClose', 'hasBindings', 'handleVisibleSwitch'],
    );

    if (lazy) {
      return null;
    }

    const renderingChildren: React.ReactNode = typeof children === 'function' ? children({ loading, disabled }) : children;

    return styled(styles)(
      <Menu
        ref={ref}
        label={translate(menuData.menu.label)}
        title={translate(menuData.menu.tooltip)}
        items={() =>
          menuData.items.map(
            item =>
              menu.current && (
                <MenuItemRenderer
                  key={item.id}
                  item={item}
                  menuData={menuData}
                  rtl={rtl}
                  menu={menu.current}
                  modal={modal}
                  style={style}
                  onItemClose={handlers.handleItemClose}
                />
              ),
          )
        }
        rtl={rtl}
        menuRef={menu}
        modal={modal}
        visible={visible}
        mouseContextMenu={mouseContextMenu}
        placement={placement}
        disabled={disabled}
        disclosure={disclosure}
        style={style}
        getHasBindings={handlers.hasBindings}
        onVisibleSwitch={handlers.handleVisibleSwitch}
        {...props}
      >
        {renderingChildren}
      </Menu>,
    );
  }),
);
