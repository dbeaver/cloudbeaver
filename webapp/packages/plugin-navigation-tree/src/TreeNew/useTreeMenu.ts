/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';
import { useId } from 'react';

import { useContextMenuPosition, useObjectRef, useObservableRef, type IContextMenuPosition } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { DATA_CONTEXT_NAV_NODE_ID } from '@cloudbeaver/core-navigation-tree';
import type { IMenuData } from '@cloudbeaver/core-view';

export interface ITreeMenu {
  menu: IMenuData;
  position: IContextMenuPosition;
  openMenu(event: React.MouseEvent, nodeId: string): void;
}

interface ITreeMenuOptions {
  menu: IMenuData;
  setContext?: (context: IDataContext, id: string) => void;
}

export function useTreeMenu(options: ITreeMenuOptions): Readonly<ITreeMenu> {
  options = useObjectRef(options);

  const id = useId();
  const position = useContextMenuPosition();

  const state = useObservableRef(
    () => ({
      openMenu(event: React.MouseEvent<HTMLDivElement, MouseEvent>, nodeId: string) {
        this.menu.context.deleteForId(this.id);
        this.menu.context.set(DATA_CONTEXT_NAV_NODE_ID, nodeId, this.id);

        if (options.setContext) {
          options.setContext(this.menu.context, this.id);
        }

        this.position.open(event);
      },
    }),
    { openMenu: action.bound },
    { id, menu: options.menu, position },
  );

  return state;
}
