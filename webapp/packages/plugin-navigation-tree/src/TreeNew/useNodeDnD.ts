/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext } from 'react';

import { useDataContext } from '@cloudbeaver/core-data-context';
import { useDNDData } from '@cloudbeaver/core-ui';

import { TreeDnDContext } from './contexts/TreeDnDContext.js';

export function useNodeDnD(nodeId: string, onDragStart: () => void) {
  const treeDnD = useContext(TreeDnDContext)!;
  const context = useDataContext();

  const dndData = useDNDData(context, {
    canDrag: () => true,
    onDragStart: () => {
      treeDnD.getContext(nodeId, context);
      onDragStart();
    },
    onDragEnd: () => {
      treeDnD.getContext(nodeId, context);
    },
  });

  return dndData;
}
