/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { useMergeRefs, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
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
  const treeDnDRef = useObjectRef({ treeDnD });
  const context = useDataContext();

  const dndData = useDNDData(context, {
    canDrag: () => {
      const dnd = treeDnDRef.treeDnD;
      return dnd ? dnd.canDrag(nodeId) : false;
    },
    onDragStart: () => {
      treeDnDRef.treeDnD?.getContext(nodeId, context);
    },
    onDragEnd: () => {
      treeDnDRef.treeDnD?.getContext(nodeId, context);
    },
  });

  const dndBox = useDNDBox({
    canDrop: moveContext => {
      const dnd = treeDnDRef.treeDnD;
      return dnd ? dnd.canDrop(nodeId, moveContext) : false;
    },
    onDrop: moveContext => treeDnDRef.treeDnD?.onDrop(nodeId, moveContext),
  });

  const setRef = useMergeRefs<Element>(dndData.setTargetRef as React.RefCallback<Element>, dndBox.setRef as React.RefCallback<Element>);

  const state = useObservableRef(
    () => ({
      get isDragging() {
        return treeDnDRef.treeDnD ? dndData.state.isDragging : false;
      },
      get isOverCurrent() {
        return treeDnDRef.treeDnD ? dndBox.state.isOverCurrent : false;
      },
      get canDrop() {
        return treeDnDRef.treeDnD ? dndBox.state.canDrop : false;
      },
    }),
    {},
    false,
  );

  return useObservableRef(
    () => ({
      state,
      setRef,
    }),
    {},
    { state, setRef },
  );
}
