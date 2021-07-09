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

function getPositionHash(position: CellPosition): string {
  return `${position.idx}_${position.rowIdx}`;
}

interface IEditingOptions {
  readonly?: boolean;
  onEdit: (position: CellPosition, key?: string) => boolean;
}

export function useEditing(options: IEditingOptions): IEditingContext {
  const optionsRef = useObjectRef(options);
  const state = useObjectRef({
    options,
    editingCells: new Set<string>(),
  }, { options }, { editingCells: observable });

  const [context] = useState<IEditingContext>({
    edit(position: CellPosition, key?: string) {
      if (optionsRef.readonly) {
        return;
      }
      // TODO: not works yet
      switch (key) {
        case 'Escape':
          state.editingCells.delete(getPositionHash(position));
          break;
      }

      if (!optionsRef.onEdit(position, key)) {
        return;
      }

      state.editingCells.clear();
      state.editingCells.add(getPositionHash(position));
    },
    closeEditor(position: CellPosition) {
      state.editingCells.delete(getPositionHash(position));
    },
    close() {
      state.editingCells.clear();
    },
    isEditing(position: CellPosition) {
      return state.editingCells.has(getPositionHash(position));
    },
  });

  return context;
}
