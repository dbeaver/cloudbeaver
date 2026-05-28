/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';
import { useId } from 'react';

import { useContextMenuPosition, useObjectRef, useObservableRef, type IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import type { IMenuData } from '@cloudbeaver/core-view';
import type { IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridMenu {
  menu: IMenuData;
  menuPosition: IContextMenuPosition;
  isMenuOpened: boolean;
  openMenu(activeCell: IGridDataKey, event: React.MouseEvent): void;
  openMenuAt(activeCell: IGridDataKey, x: number, y: number): void;
  closeMenu(): void;
}

interface IDataGridMenuOptions {
  menu: IMenuData;
  setContext?: (context: IDataContext, id: string, activeCell: IGridDataKey) => void;
}

export function useDataGridMenu(options: IDataGridMenuOptions): Readonly<IDataGridMenu> {
  options = useObjectRef(options);

  const id = useId();
  const menuPosition = useContextMenuPosition();

  const state = useObservableRef<IDataGridMenu>(
    () => ({
      menuPosition,
      get isMenuOpened() {
        return this.menuPosition.position !== null;
      },
      openMenu(activeCell: IGridDataKey, event: React.MouseEvent) {
        this.menu.context.deleteForId(id);

        if (options.setContext) {
          options.setContext(this.menu.context, id, activeCell);
        }

        this.menuPosition.open(event);
      },
      openMenuAt(activeCell: IGridDataKey, x: number, y: number) {
        this.menu.context.deleteForId(id);

        if (options.setContext) {
          options.setContext(this.menu.context, id, activeCell);
        }

        this.menuPosition.openAt(x, y);
      },
      closeMenu() {
        this.menuPosition.close();
      },
    }),
    {
      menuPosition: observable.ref,
      isMenuOpened: computed,
      openMenu: action.bound,
      openMenuAt: action.bound,
      closeMenu: action.bound,
    },
    { menu: options.menu },
  );

  return state;
}
