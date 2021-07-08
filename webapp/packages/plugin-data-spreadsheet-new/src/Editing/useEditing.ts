/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { CellPosition, IEditingContext } from './EditingContext';

function findPosition(position: CellPosition): (position: CellPosition) => boolean {
  return p => p.idx === position.idx && p.rowIdx === position.rowIdx;
}

interface IEditingOptions {
  readonly?: boolean;
  onEdit: (position: CellPosition, key?: string) => boolean;
}

export function useEditing(options: IEditingOptions): IEditingContext {
  const optionsRef = useObjectRef(options);
  const [editingCells] = useState(() => observable<CellPosition>([]));

  const [context] = useState<IEditingContext>({
    edit(position: CellPosition, key?: string) {
      if (optionsRef.readonly) {
        return;
      }
      // TODO: not works yet
      switch (key) {
        case 'Escape':
          editingCells.splice(editingCells.findIndex(findPosition(position)), 1);
          break;
      }

      if (!optionsRef.onEdit(position, key)) {
        return;
      }

      editingCells.clear();
      editingCells.push(position);
    },
    closeEditor(position: CellPosition) {
      editingCells.splice(editingCells.findIndex(findPosition(position)), 1);
    },
    close() {
      editingCells.clear();
    },
    isEditing(position: CellPosition) {
      return editingCells.some(findPosition(position));
    },
  });

  return context;
}
