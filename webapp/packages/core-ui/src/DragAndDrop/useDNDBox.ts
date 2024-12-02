/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable, runInAction } from 'mobx';
import React, { useRef } from 'react';
import { useDrop } from 'react-dnd';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';

import { DND_ELEMENT_TYPE } from './DND_ELEMENT_TYPE.js';
import type { DNDAcceptType } from './DNDAcceptType.js';

interface IState {
  isOver: boolean;
  isOverCurrent: boolean;
  canDrop: boolean;
  context: IDataContextProvider | null;
}

interface IMousePosition {
  x: number;
  y: number;
}

interface IOptions {
  type?: DNDAcceptType;
  onHover?: (context: IDataContextProvider, pos: IMousePosition | null) => void;
  onDrop?: (context: IDataContextProvider, pos: IMousePosition | null) => void;
  canDrop?: (context: IDataContextProvider, isOver: boolean) => boolean;
}

export interface IDNDBox {
  ref: React.MutableRefObject<React.ReactElement | Element | null>;
  state: IState;
  setRef: (element: React.ReactElement | Element | null) => void;
}

export function useDNDBox(options: IOptions): IDNDBox {
  options = useObjectRef({
    type: DND_ELEMENT_TYPE,
    ...options,
  });

  const ref = useRef<React.ReactElement | Element | null>(null);

  const state = useObservableRef<IState>(
    () => ({
      isOver: false,
      isOverCurrent: false,
      canDrop: false,
      context: null,
    }),
    {
      isOver: observable.ref,
      isOverCurrent: observable.ref,
      canDrop: observable.ref,
      context: observable.ref,
    },
    false,
  );

  const [, setTargetRef] = useDrop<IDataContextProvider, void, void>(
    () => ({
      accept: options.type as string | string[],
      drop: (item, monitor) => {
        if (monitor.didDrop() || !monitor.isOver({ shallow: true })) {
          return;
        }

        options.onDrop?.(item, monitor.getClientOffset());
      },
      hover: (item, monitor) => {
        if (monitor.canDrop()) {
          options.onHover?.(item, monitor.getClientOffset());
        }
      },
      canDrop: (context, monitor) => options.canDrop?.(context, monitor.isOver({ shallow: true })) ?? true,
      collect: monitor => {
        runInAction(() => {
          state.isOver = monitor.isOver();
          state.isOverCurrent = monitor.isOver({ shallow: true });
          state.canDrop = monitor.canDrop();
          state.context = monitor.getItem();
        });
      },
    }),
    [options],
  );

  return useObjectRef(
    () => ({
      ref,
      state,
      setRef(element: React.ReactElement | Element | null) {
        this.setTargetRef(element);
        ref.current = element;
      },
    }),
    { setTargetRef },
    ['setRef'],
  );
}
