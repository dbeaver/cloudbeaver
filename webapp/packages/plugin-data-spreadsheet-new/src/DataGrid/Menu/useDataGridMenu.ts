/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { useId } from 'react';

import { useContextMenuPosition, useObservableRef, type IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IMenuData } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_DV_RESULT_KEY, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridMenu {
  menu: IMenuData;
  menuPosition: IContextMenuPosition;
  id: string;
  openMenu(activeCell: IGridDataKey, event: React.MouseEvent | React.KeyboardEvent): void;
  closeMenu(): void;
}

interface IDataGridMenuOptions {
  menu: IMenuData;
}

export function useDataGridMenu(options: IDataGridMenuOptions): Readonly<IDataGridMenu> {
  const id = useId();
  const menuPosition = useContextMenuPosition();

  const state = useObservableRef<IDataGridMenu>(
    () => ({
      id,
      menuPosition,
      openMenu(activeCell: IGridDataKey, event: React.MouseEvent | React.KeyboardEvent) {
        this.menu.context.deleteForId(id);
        this.menu.context.set(DATA_CONTEXT_DV_RESULT_KEY, activeCell, this.id);
        this.menuPosition.open(event);
      },
      closeMenu() {
        this.menuPosition.close();
      },
    }),
    {
      menuPosition: observable.ref,
      openMenu: action.bound,
      closeMenu: action.bound,
    },
    { menu: options.menu, id },
  );

  return state;
}
