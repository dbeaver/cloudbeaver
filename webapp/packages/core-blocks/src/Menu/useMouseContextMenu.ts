/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '../useObservableRef';

export interface IContextMenuPosition {
  x: number;
  y: number;
}

export interface IMouseContextMenu {
  position: IContextMenuPosition | null;
  handleContextMenuOpen: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export function useMouseContextMenu(): IMouseContextMenu {
  return useObservableRef<IMouseContextMenu>(
    () => ({
      position: null,
      handleContextMenuOpen(event: React.MouseEvent<HTMLDivElement>) {
        if (!event.currentTarget.contains(event.target as Node)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();

        this.position = {
          x: event.clientX,
          y: event.clientY,
        };
      },
    }),
    { position: observable.ref },
    false,
    ['handleContextMenuOpen'],
  );
}
