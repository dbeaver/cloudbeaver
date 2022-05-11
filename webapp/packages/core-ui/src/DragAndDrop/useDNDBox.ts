/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useDrop } from 'react-dnd';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import type { IDataContextProvider } from '@cloudbeaver/core-view';

import { DND_ELEMENT_TYPE } from './DND_ELEMENT_TYPE';
import type { DNDAcceptType } from './DNDAcceptType';

interface IState {
  isOver: boolean;
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
  canDrop?: (context: IDataContextProvider) => boolean;
}

interface IDNDBox {
  state: IState;
  setRef: (element: React.ReactElement | Element | null) => void;
}

export function useDNDBox(options: IOptions): IDNDBox {
  options = useObjectRef({
    type: DND_ELEMENT_TYPE,
    ...options,
  });

  const state = useObservableRef<IState>(() => ({
    isOver: false,
    canDrop: false,
    context: null,
  }), {
    isOver: observable.ref,
    canDrop: observable.ref,
    context: observable.ref,
  }, false);

  const [, setTargetRef] = useDrop<IDataContextProvider, void, void>(() => ({
    accept: options.type as string | string[],
    drop: (item, monitor) => options.onDrop?.(item, monitor.getClientOffset()),
    hover: (item, monitor) => {
      if (monitor.canDrop()) {
        options.onHover?.(item, monitor.getClientOffset());
      }
    },
    canDrop: context => (options.canDrop?.(context) ?? true),
    collect: monitor => {
      state.isOver = monitor.isOver();
      state.canDrop = monitor.canDrop();
      state.context = monitor.getItem();
    },
  }), [options]);

  return useObjectRef(() => ({
    state,
    setRef(element: React.ReactElement | Element | null) {
      this.setTargetRef(element);
    },
  }), { setTargetRef }, ['setRef']);
}