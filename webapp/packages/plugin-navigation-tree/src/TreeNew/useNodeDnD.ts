/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';
import { observable } from 'mobx';

import { useMergeRefs, useObservableRef } from '@cloudbeaver/core-blocks';
import { useDataContext } from '@cloudbeaver/core-data-context';
import { useDNDBox, useDNDData } from '@cloudbeaver/core-ui';

import { TreeDnDContext } from './contexts/TreeDnDContext.js';

export interface INodeDnD {
  state: {
    isDragging: boolean;
    isOverCurrent: boolean;
    canDrop: boolean;
  };
  setRef: React.RefCallback<Element>;
}

export function useNodeDnD(nodeId: string): INodeDnD {
  const treeDnD = useContext(TreeDnDContext);
  const context = useDataContext();

  const dndData = useDNDData(context, {
    canDrag: () => (treeDnD ? treeDnD.canDrag(nodeId) : false),
    onDragStart: () => {
      treeDnD?.getContext(nodeId, context);
    },
    onDragEnd: () => {
      treeDnD?.getContext(nodeId, context);
    },
  });

  const dndBox = useDNDBox({
    canDrop: (moveContext, isOver) => {
      if (!treeDnD || !isOver) {
        return false;
      }
      return treeDnD.canDrop(nodeId, moveContext);
    },
    onDrop: moveContext => treeDnD?.onDrop(nodeId, moveContext),
  });

  const setRef = useMergeRefs<Element>(dndData.setTargetRef as React.RefCallback<Element>, dndBox.setRef as React.RefCallback<Element>);

  const state = useObservableRef(
    () => ({
      treeDnD,
      get isDragging() {
        return this.treeDnD ? dndData.state.isDragging : false;
      },
      get isOverCurrent() {
        return this.treeDnD ? dndBox.state.isOverCurrent : false;
      },
      get canDrop() {
        return this.treeDnD ? dndBox.state.canDrop : false;
      },
    }),
    {
      treeDnD: observable.ref,
    },
    { treeDnD },
  );

  return useObservableRef(
    () => ({
      state,
      setRef,
    }),
    {
      state: observable.ref,
      setRef: observable.ref,
    },
    { state, setRef },
  );
}
