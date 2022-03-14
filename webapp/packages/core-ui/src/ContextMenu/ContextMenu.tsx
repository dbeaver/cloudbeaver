/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { ButtonHTMLAttributes, useCallback, useEffect } from 'react';
import { MenuButton, MenuInitialState, useMenuState } from 'reakit/Menu';
import styled from 'reshadow';

import { getComputed, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { IMenuData, MenuService } from '@cloudbeaver/core-view';

import { MenuItemRenderer } from './MenuItemRenderer';
import { MenuPanel } from './MenuPanel';
import { menuPanelStyles } from './menuPanelStyles';

interface IMenuProps {
  loading: boolean;
  disabled: boolean;
}

type ContextMenuRenderingChildren = (props: IMenuProps) => React.ReactNode;

interface IContextMenuProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
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

export const ContextMenu = observer<IContextMenuProps, ButtonHTMLAttributes<any>>(function ContextMenu({
  menu: menuData,
  disclosure,
  children,
  style,
  placement,
  visible,
  onVisibleSwitch,
  modal,
  rtl,
  ...props
}, ref) {
  const menuService = useService(MenuService);

  const handler = getComputed(() => menuService.getHandler(menuData.context));
  const hidden = getComputed(() => handler?.isHidden?.(menuData.context) || false);
  const loading = getComputed(() => handler?.isLoading?.(menuData.context) || false);
  const disabled = getComputed(() => loading || handler?.isDisabled?.(menuData.context) || false);
  const lazy = getComputed(() => !menuData.available || hidden);

  const propsRef = useObjectRef({ onVisibleSwitch, visible });
  const menu = useMenuState({ modal, placement, visible, rtl });
  const styles = useStyles(menuPanelStyles, style);

  const handleItemClose = useCallback(() => {
    menu.hide();
  }, [menu]);

  useEffect(() => {
    propsRef.onVisibleSwitch?.(menu.visible);

    if (menu.visible) {
      handler?.handler?.(menuData.context);
    }
  }, [menu.visible]);

  if (lazy) {
    return null;
  }

  // TODO: fix type error
  const renderingChildren: React.ReactNode  = typeof children === 'function'
    ? (children as any)({ loading, disabled })
    : children;

  if (React.isValidElement(renderingChildren) && disclosure) {
    return styled(styles)(
      <>
        <MenuButton ref={ref} {...menu} {...props} {...renderingChildren.props} disabled={disabled}>
          {disclosureProps => React.cloneElement(renderingChildren, { ...disclosureProps, ...renderingChildren.props })}
        </MenuButton>
        <MenuPanel
          menuData={menuData}
          menu={menu}
          style={style}
          rtl={rtl}
        >
          {item => (
            <MenuItemRenderer
              key={item.id}
              item={item}
              menuData={menuData}
              menu={menu}
              style={style}
              onItemClose={handleItemClose}
            />
          )}
        </MenuPanel>
      </>
    );
  }

  return styled(styles)(
    <>
      <MenuButton {...menu} {...props} disabled={disabled}>
        <box>{renderingChildren}</box>
      </MenuButton>
      <MenuPanel
        menuData={menuData}
        menu={menu}
        style={style}
        rtl={rtl}
      >
        {item => (
          <MenuItemRenderer
            key={item.id}
            item={item}
            menuData={menuData}
            menu={menu}
            style={style}
            onItemClose={handleItemClose}
          />
        )}
      </MenuPanel>
    </>
  );
}, { forwardRef: true });
