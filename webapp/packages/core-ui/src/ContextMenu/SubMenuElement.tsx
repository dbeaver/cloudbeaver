/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useRef, useState } from 'react';

import { getComputed, type IMenuState, Menu, MenuItemElement, useAutoLoad, useObjectRef } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import {
  DATA_CONTEXT_MENU_NESTED,
  DATA_CONTEXT_SUBMENU_ITEM,
  type IMenuData,
  type IMenuSubMenuItem,
  MenuActionItem,
  useMenu,
} from '@cloudbeaver/core-view';

import type { IMenuItemRendererProps } from './MenuItemRenderer.js';

interface ISubMenuElementProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menuData: IMenuData;
  subMenu: IMenuSubMenuItem;
  itemRenderer: React.FC<IMenuItemRendererProps>;
  menuModal?: boolean;
  menuRtl?: boolean;
  onItemClose?: () => void;
}

export const SubMenuElement = observer<ISubMenuElementProps, HTMLButtonElement>(
  forwardRef(function SubMenuElement({ menuData, subMenu, itemRenderer, menuModal: modal, menuRtl: rtl, onItemClose, ...rest }, ref) {
    const menu = useRef<IMenuState>(null);
    const subMenuData = useMenu({ menu: subMenu.menu, context: menuData.context });
    const [visible, setVisible] = useState(false);

    useDataContextLink(subMenuData.context, (context, id) => {
      context.set(DATA_CONTEXT_MENU_NESTED, true, id);
      context.set(DATA_CONTEXT_SUBMENU_ITEM, subMenu, id);
    });

    const handler = subMenuData.handler;
    const hidden = getComputed(() => handler?.isHidden?.(subMenuData.context));
    useAutoLoad(SubMenuElement, subMenuData.loaders, !hidden, visible, true);

    const handlers = useObjectRef(
      () => ({
        handleItemClose() {
          menu.current?.hide();
          this.onItemClose?.();
        },
        hasBindings() {
          return this.subMenuData.items.some(item => item instanceof MenuActionItem && item.action.binding !== null);
        },
        handleVisibleSwitch(visible: boolean) {
          setVisible(visible);
          if (visible) {
            this.subMenu.events?.onOpen?.();
            this.handler?.handler?.(this.subMenuData.context);
          }
        },
      }),
      { subMenuData, menuData, handler, subMenu, onItemClose },
      ['handleItemClose', 'hasBindings', 'handleVisibleSwitch'],
    );

    if (hidden || !subMenuData.items.length) {
      return null;
    }

    const IconComponent = handler?.iconComponent?.() ?? subMenu.iconComponent?.();
    const extraProps = handler?.getExtraProps?.() ?? (subMenu.getExtraProps?.() as any);
    const loading = getComputed(() => handler?.isLoading?.(subMenuData.context) || subMenuData.loaders.some(loader => loader.isLoading()) || false);
    /** @deprecated must be refactored (#1)*/
    const displayLabel = getComputed(() => handler?.isLabelVisible?.(subMenuData.context, subMenuData.menu) ?? true);
    const disabled = getComputed(() => handler?.isDisabled?.(subMenuData.context));
    const loaded = getComputed(() => !subMenuData.loaders.some(loader => !loader.isLoaded()));
    const info = handler?.getInfo?.(subMenuData.context, subMenuData.menu);
    const label = info?.label ?? subMenu.label ?? subMenu.menu.info.label;
    const icon = info?.icon ?? subMenu.icon ?? subMenu.menu.info.icon;

    const tooltip = info?.tooltip ?? subMenu.tooltip ?? subMenu.menu.info.tooltip;
    const MenuItemRenderer = itemRenderer;
    const panelAvailable = subMenuData.available || !loaded;

    return (
      <Menu
        {...rest}
        ref={ref}
        menuRef={menu}
        label={subMenuData.menu.info.label}
        items={() =>
          subMenuData.items.map(
            item =>
              menu.current && (
                <MenuItemRenderer key={item.id} item={item} menuData={subMenuData} rtl={rtl} modal={modal} onItemClose={handlers.handleItemClose} />
              ),
          )
        }
        rtl={rtl}
        modal={modal}
        placement={rtl ? 'left-start' : 'right-start'}
        panelAvailable={panelAvailable}
        disabled={disabled}
        getHasBindings={handlers.hasBindings}
        submenu
        onVisibleSwitch={handlers.handleVisibleSwitch}
      >
        <MenuItemElement
          label={label}
          displayLabel={displayLabel}
          icon={IconComponent ? <IconComponent item={subMenu} {...extraProps} /> : icon}
          tooltip={tooltip}
          panelAvailable={panelAvailable}
          loading={loading}
          menu
        />
      </Menu>
    );
  }),
);
