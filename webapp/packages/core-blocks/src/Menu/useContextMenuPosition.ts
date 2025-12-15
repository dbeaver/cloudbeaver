/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '../useObservableRef.js';

export interface IContextMenuPositionCoords {
  x: number;
  y: number;
}

export interface IContextMenuPosition {
  position: IContextMenuPositionCoords | null;
  open: (event: React.MouseEvent) => void;
  close: () => void;
}

export function useContextMenuPosition(): IContextMenuPosition {
  return useObservableRef<IContextMenuPosition>(
    () => ({
      position: null,
      open(event: React.MouseEvent) {
        if (!event.currentTarget.contains(event.target as Node)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        let x = event.clientX;
        let y = event.clientY;

        if (x === 0 && y === 0) {
          const rect = event.currentTarget.getBoundingClientRect();

          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }

        this.position = {
          x,
          y,
        };
      },
      close() {
        this.position = null;
      },
    }),
    { position: observable.ref },
    false,
    ['open', 'close'],
  );
}
