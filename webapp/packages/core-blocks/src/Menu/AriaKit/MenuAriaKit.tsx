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
import { forwardRef, useEffect } from 'react';
import { MenuField, useMenuStore, useStoreState, type MenuFieldProps, type MenuItemData, type MenuStoreProps } from '@dbeaver/ui-kit';

import { ErrorBoundary } from '../../ErrorBoundary.js';
import type { IContextMenuPosition } from '../useContextMenuPosition.js';
import './MenuAriaKit.css';

export interface IMenuAriaKitProps<Value = string> extends MenuFieldProps<Value, MenuItemData<Value>> {
  contextMenuPosition?: IContextMenuPosition;
  modal?: boolean;
  menuStoreProps?: MenuStoreProps;
}

export const MenuAriaKit = observer<IMenuAriaKitProps>(
  forwardRef(function MenuAriaKit({ contextMenuPosition, items, menuStoreProps, ...props }) {
    const store = useMenuStore(menuStoreProps);
    const storeState = useStoreState(store);
    const menuVisible = !!storeState.open;

    function getAnchorRect() {
      if (!contextMenuPosition?.position) {
        return;
      }

      return () => contextMenuPosition.position;
    }

    useEffect(() => {
      if (!contextMenuPosition?.position || menuVisible) {
        return;
      }

      store.show();
      contextMenuPosition.position = null;
    }, [contextMenuPosition?.position, menuVisible]);

    return (
      <ErrorBoundary>
        <MenuField store={store} items={items} getAnchorRect={getAnchorRect()} {...props} />
      </ErrorBoundary>
    );
  }),
);
