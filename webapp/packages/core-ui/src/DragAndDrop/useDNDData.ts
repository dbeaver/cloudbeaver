/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useDrag } from 'react-dnd';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import type { IDataContextProvider } from '@cloudbeaver/core-view';

import { DND_ELEMENT_TYPE } from './DND_ELEMENT_TYPE';

interface IState {
  isDragging: boolean;
}

export interface IDNDData {
  state: IState;
  setTargetRef: (element: React.ReactElement | Element | null) => void;
  setPreviewRef: (element: React.ReactElement | Element | null) => void;
}

interface IDNDDataPrivate extends IDNDData {
  setTarget: (element: React.ReactElement | Element | null) => void;
  setPreview: (element: React.ReactElement | Element | null) => void;
}

interface IOptions {
  onDragStart: () => void;
}

export function useDNDData(context: IDataContextProvider, options: IOptions): IDNDData {
  const state = useObservableRef<IState>(() => ({
    isDragging: false,
  }), {
    isDragging: observable.ref,
  }, false);
  options = useObjectRef(options);

  const [, setTarget, setPreview] = useDrag<IDataContextProvider, void, void>(() => ({
    type:DND_ELEMENT_TYPE,
    item: context,
    collect: monitor => {
      const dragging = monitor.isDragging();

      if (dragging !== state.isDragging && dragging) {
        options.onDragStart();
      }

      state.isDragging = monitor.isDragging();
    },
  }));

  return useObjectRef<IDNDDataPrivate>(() => ({
    state,
    setTargetRef(element) {
      this.setTarget(element);
    },
    setPreviewRef(element) {
      this.setPreview(element);
    },
  }), { setTarget, setPreview }, ['setTargetRef', 'setPreviewRef']);
}