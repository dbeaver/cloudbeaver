/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getComputed, MenuAriaKit, useAutoLoad, useObjectRef, useTranslate, type IMenuAriaKitProps } from '@cloudbeaver/core-blocks';
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { MenuActionItem, type IMenuData, type IMenuItem } from '@cloudbeaver/core-view';
import { MenuItemRendererAriaKit } from './MenuItemRendererAriaKit.js';

export interface IContextMenuAriaKitProps extends Omit<IMenuAriaKitProps<IMenuItem>, 'items' | 'itemRender'> {
  menu: IMenuData;
}

export const ContextMenuAriaKit = observer<IContextMenuAriaKitProps, HTMLButtonElement>(
  forwardRef(function ContextMenuAriaKit({ contextMenuPosition, menu: menuData, onSwitch, ...props }, ref) {
    const translate = useTranslate();

    const handler = menuData.handler;
    const hidden = getComputed(() => handler?.isHidden?.(menuData.context) || false);
    const loading = getComputed(() => handler?.isLoading?.(menuData.context) || menuData.loaders.some(loader => loader.isLoading()) || false);
    const disabled = getComputed(() => loading || handler?.isDisabled?.(menuData.context) || false);
    const lazy = getComputed(() => !menuData.available || hidden);

    useAutoLoad({ name: `${ContextMenuAriaKit.name}(${menuData.menu.id})` }, menuData.loaders, !lazy, lazy, true);

    const handlers = useObjectRef(
      () => ({
        hasBindings() {
          return this.menuData.items.some(item => item instanceof MenuActionItem && item.action.binding !== null);
        },
        handleVisibleSwitch(visible: boolean) {
          this.onSwitch?.(visible);

          if (visible) {
            this.handler?.handler?.(this.menuData.context);
          }
        },
      }),
      { menuData, handler, onSwitch },
      ['hasBindings', 'handleVisibleSwitch'],
    );

    if (lazy) {
      return null;
    }

    return (
      <MenuAriaKit
        {...props}
        ref={ref}
        aria-label={translate(menuData.menu.info.label)}
        contextMenuPosition={contextMenuPosition}
        disabled={disabled}
        items={menuData.items}
        itemRender={item => <MenuItemRendererAriaKit key={item.id} item={item} menuData={menuData} />}
        onSwitch={handlers.handleVisibleSwitch}
      />
    );
  }),
);
