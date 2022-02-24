/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useEffect } from 'react';
import { MenuButton, useMenuState } from 'reakit/Menu';
import styled from 'reshadow';

import { getComputed } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { DATA_CONTEXT_MENU_NESTED, IMenuData, IMenuSubMenuItem, MenuService, useMenu } from '@cloudbeaver/core-view';

import { MenuItemElement } from './MenuItemElement';
import type { IMenuItemRendererProps } from './MenuItemRenderer';
import type { IMenuPanelProps } from './MenuPanel';
import { menuPanelStyles } from './menuPanelStyles';

interface ISubMenuElementProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menuData: IMenuData;
  subMenu: IMenuSubMenuItem;
  itemRenderer: React.FC<IMenuItemRendererProps>;
  menuPanel: React.FC<IMenuPanelProps>;
  onItemClose?: () => void;
  style?: ComponentStyle;
}

export const SubMenuElement = observer<ISubMenuElementProps, HTMLButtonElement>(function SubMenuElement(
  {
    menuData,
    subMenu,
    itemRenderer,
    menuPanel,
    style,
    onItemClose,
    ...rest
  },
  ref
) {
  const menuService = useService(MenuService);
  const menu = useMenuState();
  const styles = useStyles(menuPanelStyles, style);
  const subMenuData = useMenu({ menu: subMenu.menu, context: menuData.context });
  subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true);

  const handler = menuService.getHandler(subMenuData.context);
  const hidden = getComputed(() => handler?.isHidden?.(subMenuData.context));

  const handleItemClose = useCallback(() => {
    menu.hide();
    onItemClose?.();
  }, [menu, onItemClose]);

  useEffect(() => {
    if (menu.visible) {
      subMenu.events?.onOpen?.();
      handler?.handler?.(subMenuData.context);
    }
  }, [menu.visible]);

  if (hidden) {
    return null;
  }

  const loading = getComputed(() => handler?.isLoading?.(subMenuData.context));
  const disabled = getComputed(() => handler?.isDisabled?.(subMenuData.context));
  const MenuPanel = menuPanel;
  const MenuItemRenderer = itemRenderer;

  return styled(styles)(
    <>
      <MenuButton ref={ref} {...menu} {...rest} disabled={disabled}>
        <box>
          <MenuItemElement
            label={subMenu.menu.label}
            icon={subMenu.menu.icon}
            tooltip={subMenu.menu.tooltip}
            loading={loading}
            style={style}
            menu
          />
        </box>
      </MenuButton>
      <MenuPanel
        menuData={subMenuData}
        menu={menu}
        style={style}
        panelAvailable={subMenuData.available && !loading}
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