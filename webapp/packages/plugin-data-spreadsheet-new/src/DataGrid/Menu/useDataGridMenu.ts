/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';
import { useId } from 'react';

import { useContextMenuPosition, useObservableRef, type IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IMenuData } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_DV_RESULT_KEY, type IGridDataKey } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridMenu {
  menu: IMenuData;
  position: IContextMenuPosition;
  id: string;
  openMenu(activeCell: IGridDataKey, event: React.MouseEvent | React.KeyboardEvent): void;
  closeMenu(): void;
}

interface IDataGridMenuOptions {
  menu: IMenuData;
}

export function useDataGridMenu(options: IDataGridMenuOptions): Readonly<IDataGridMenu> {
  const id = useId();
  const position = useContextMenuPosition();

  const state = useObservableRef<IDataGridMenu>(
    () => ({
      openMenu(activeCell: IGridDataKey, event: React.MouseEvent | React.KeyboardEvent) {
        this.menu.context.deleteForId(this.id);
        this.menu.context.set(DATA_CONTEXT_DV_RESULT_KEY, activeCell, this.id);

        this.position.open(event);
      },
      closeMenu() {
        this.menu.context.deleteForId(this.id);
        this.position.close();
      },
    }),
    {
      openMenu: action.bound,
      closeMenu: action.bound,
    },
    { menu: options.menu, id, position },
  );

  return state;
}
