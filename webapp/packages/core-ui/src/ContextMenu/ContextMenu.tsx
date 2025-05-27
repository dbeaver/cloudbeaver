/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useRef, useState } from 'react';

import { getComputed, type IMenuState, Menu, useAutoLoad, useObjectRef, useTranslate } from '@cloudbeaver/core-blocks';
import { MenuActionItem } from '@cloudbeaver/core-view';

import type { IContextMenuProps } from './IContextMenuProps.js';
import { MenuItemRenderer } from './MenuItemRenderer.js';

// TODO the click doesn't work for React components as children
export const ContextMenu = observer<IContextMenuProps, HTMLButtonElement>(
  forwardRef(function ContextMenu(
    { contextMenuPosition, menu: menuData, disclosure, children, placement, visible, onVisibleSwitch, modal, rtl, ...props },
    ref,
  ) {
    const translate = useTranslate();
    const [menuVisible, setMenuVisible] = useState(false);

    const handler = menuData.handler;
    const hidden = getComputed(() => handler?.isHidden?.(menuData.context) || false);
    const loading = getComputed(() => handler?.isLoading?.(menuData.context) || menuData.loaders.some(loader => loader.isLoading()) || false);
    const disabled = getComputed(() => loading || handler?.isDisabled?.(menuData.context) || false);
    const lazy = getComputed(() => !menuData.available || hidden);

    const menu = useRef<IMenuState>(null);

    useAutoLoad({ name: `${ContextMenu.name}(${menuData.menu.id})` }, menuData.loaders, !lazy, menuVisible, true);

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

    return (
      <Menu
        {...props}
        ref={ref}
        label={translate(menuData.menu.info.label)}
        title={translate(menuData.menu.info.tooltip)}
        items={() =>
          menuData.items.map(
            item =>
              menu.current && (
                <MenuItemRenderer key={item.id} item={item} menuData={menuData} rtl={rtl} modal={modal} onItemClose={handlers.handleItemClose} />
              ),
          )
        }
        rtl={rtl}
        menuRef={menu}
        modal={modal}
        visible={visible}
        contextMenuPosition={contextMenuPosition}
        placement={placement}
        disabled={disabled}
        disclosure={disclosure}
        getHasBindings={handlers.hasBindings}
        onVisibleSwitch={handlers.handleVisibleSwitch}
      >
        {renderingChildren}
      </Menu>
    );
  }),
);
