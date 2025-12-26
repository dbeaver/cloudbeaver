/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { use, useLayoutEffect, useMemo } from 'react';

import { MenuItemElement, useAutoLoad, useObjectRef, useTranslate } from '@cloudbeaver/core-blocks';
import type { IContextMenuProps } from './IContextMenuProps.js';
import { MenuButton, MenuProvider, Menu, type HovercardStoreState, useMenuStore, useStoreState } from '@dbeaver/ui-kit';
import { RenderMenuItems } from './RenderMenuItems.js';
import { type IMenuContext, MenuContext } from './MenuContext.js';

export interface IContextMenuNewProps extends Omit<IContextMenuProps, 'placement'> {
  render?: React.ReactElement;
  placement?: HovercardStoreState['placement'];
  showOnHover?: boolean;
  ref?: React.ForwardedRef<HTMLButtonElement>;
  shift?: number;
  gutter?: number;
}

export const ContextMenu = observer<IContextMenuNewProps>(function ContextMenuInner({
  contextMenuPosition,
  menu: menuData,
  children,
  placement,
  visible,
  onVisibleSwitch,
  rtl,
  shift,
  gutter,
  ...rest
}) {
  const translate = useTranslate();
  const parent = use(MenuContext);
  const menu = useMenuStore({ placement, rtl: rtl || parent?.rtl, open: visible });
  const isRtl = useStoreState(menu, 'rtl');
  const isMenuOpen = useStoreState(menu, 'open');

  const handler = menuData.handler;

  useAutoLoad({ name: `${ContextMenuInner.name}(${menuData.menu.id})` }, menuData.loaders, true, isMenuOpen, true);

  const handlers = useObjectRef(
    () => ({
      getAnchorRect() {
        if (this.contextMenuPosition?.position) {
          return this.contextMenuPosition.position;
        }

        return null;
      },
      handleVisibleSwitch(visible: boolean) {
        this.onVisibleSwitch?.(visible);

        if (visible) {
          this.handler?.handler?.(this.menuData.context);
        } else {
          this.contextMenuPosition?.close();
        }
      },
    }),
    { menuData, handler, onVisibleSwitch, contextMenuPosition },
    ['getAnchorRect', 'handleVisibleSwitch'],
  );

  const showAtPosition = !!contextMenuPosition?.position;
  useLayoutEffect(() => {
    if (showAtPosition) {
      menu.show();
    }
  }, [showAtPosition, menu]);

  const menuContext = useMemo<IMenuContext>(() => ({ menu: menuData, rtl: isRtl }), [menuData, isRtl]);

  if (handler?.isHidden?.(menuData.context)) {
    return null;
  }

  return (
    <MenuContext value={menuContext}>
      <MenuProvider store={menu} setOpen={handlers.handleVisibleSwitch}>
        <MenuButton {...rest} title={translate(menuData.menu.info.tooltip)}>
          {children}
        </MenuButton>
        <Menu
          aria-label={translate(menuData.menu.info.label)}
          getAnchorRect={contextMenuPosition ? handlers.getAnchorRect : undefined}
          shift={shift}
          gutter={gutter}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          {isMenuOpen && (
            <RenderMenuItems
              menu={menuData}
              menuComponent={ContextMenu}
              itemComponent={MenuItemElement}
              groupComponent={GroupComponent}
              groupArrowComponent={GroupArrowComponent}
            />
          )}
        </Menu>
      </MenuProvider>
    </MenuContext>
  );
});

function GroupComponent(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} />;
}

function GroupArrowComponent(props: React.HTMLAttributes<HTMLButtonElement>) {
  return <button {...props} />;
}
