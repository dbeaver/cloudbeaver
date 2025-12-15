/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, type ReactNode } from 'react';
import { clsx, Menu, useMenuStore, useStoreState, type MenuButtonProps, type MenuStoreProps } from '@dbeaver/ui-kit';

import { ErrorBoundary } from '../../ErrorBoundary.js';
import type { IContextMenuPosition } from '../useContextMenuPosition.js';
import './MenuAriaKit.css';

export interface IMenuAriaKitProps extends MenuButtonProps {
  // Items should be instances of Menu: Menu.Item, Menu.Separator, or Menu.Group, etc
  items: ReactNode[];
  contextMenuPosition?: IContextMenuPosition;
  menuStoreProps?: MenuStoreProps;
  onSwitch?: (open: boolean) => void;
  className?: string;
  noItemsPlaceholder?: React.ReactNode;
  buttonElement?: React.ReactNode;
}

export const MenuAriaKit = observer(function MenuAriaKit({
  contextMenuPosition,
  menuStoreProps,
  items,
  onSwitch,
  noItemsPlaceholder = 'No items',
  className,
  buttonElement,
  ...rest
}: IMenuAriaKitProps) {
  const store = useMenuStore(menuStoreProps);
  const isOpen = useStoreState(store, 'open');

  function getAnchorRect() {
    if (!contextMenuPosition?.position) {
      return;
    }

    return () => contextMenuPosition.position;
  }

  useEffect(() => {
    if (!contextMenuPosition?.position || isOpen) {
      return;
    }

    store.show();
  }, [contextMenuPosition?.position]);

  useEffect(() => {
    onSwitch?.(isOpen);
  }, [isOpen, onSwitch]);

  return (
    <ErrorBoundary>
      <div className={clsx('dbv-kit-menu__container', className)}>
        <Menu.Provider store={store}>
          <Menu.Button {...rest}>{buttonElement ?? <Menu.ButtonArrow className="dbv-kit-menu__arrow-icon" />}</Menu.Button>
          <Menu getAnchorRect={getAnchorRect()}>{items.length === 0 ? <div className="dbv-kit-menu__empty">{noItemsPlaceholder}</div> : items}</Menu>
        </Menu.Provider>
      </div>
    </ErrorBoundary>
  );
});
