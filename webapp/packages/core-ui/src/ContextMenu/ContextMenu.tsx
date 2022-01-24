/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { ButtonHTMLAttributes, useCallback, useEffect } from 'react';
import {
  MenuButton, MenuInitialState, useMenuState
} from 'reakit/Menu';
import styled from 'reshadow';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { IMenuData, MenuService } from '@cloudbeaver/core-view';

import { MenuItemRenderer } from './MenuItemRenderer';
import { MenuPanel } from './MenuPanel';
import { menuPanelStyles } from './menuPanelStyles';

interface IContextMenuProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  menu: IMenuData;
  style?: ComponentStyle;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
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

  const handler = menuService.getHandler(menuData.context);
  const hidden = handler?.isHidden?.(menuData.context);
  const loading = handler?.isLoading?.(menuData.context);
  const disabled = loading || handler?.isDisabled?.(menuData.context);

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

  if (!menuData.isAvailable() || hidden) {
    return null;
  }

  if (React.isValidElement(children) && disclosure) {
    return styled(styles)(
      <>
        <MenuButton ref={ref} {...menu} {...props} {...children.props} disabled={disabled}>
          {disclosureProps => React.cloneElement(children, { ...disclosureProps, ...children.props, loading })}
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
        <box>{children}</box>
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
