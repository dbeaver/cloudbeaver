/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '../useObservableRef.js';
import { isKeyboardEvent, isMouseEvent } from '@cloudbeaver/core-utils';

export interface IContextMenuPositionCoords {
  x: number;
  y: number;
}

export interface IContextMenuPosition {
  position: IContextMenuPositionCoords | null;
  open: (event: React.MouseEvent | React.KeyboardEvent) => void;
  openAt: (x: number, y: number) => void;
  close: () => void;
}

export function useContextMenuPosition(): IContextMenuPosition {
  return useObservableRef<IContextMenuPosition>(
    () => ({
      position: null,
      open(event: React.MouseEvent | React.KeyboardEvent) {
        if (!event.currentTarget.contains(event.target as Node)) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        let x = 0;
        let y = 0;

        if (isMouseEvent(event)) {
          x = event.clientX;
          y = event.clientY;
        } else if (isKeyboardEvent(event)) {
          x = event.currentTarget.getBoundingClientRect().right;
          y = event.currentTarget.getBoundingClientRect().bottom;
        }

        if (x === 0 && y === 0) {
          const rect = event.currentTarget.getBoundingClientRect();

          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }

        this.openAt(x, y);
      },
      openAt(x: number, y: number) {
        this.position = { x, y };
      },
      close() {
        this.position = null;
      },
    }),
    { position: observable.ref },
    false,
    ['open', 'openAt', 'close'],
  );
}
