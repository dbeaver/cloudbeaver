/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { MetadataMap } from '@cloudbeaver/core-utils';

import type { CellPosition, IEditingContext } from './EditingContext';

interface IEditingState {
  editing: boolean;
}

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
    editingCells: new MetadataMap<string, IEditingState>(() => ({ editing: false })),
  }, { options });

  const [context] = useState<IEditingContext>({
    readonly: !!optionsRef.readonly,
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
      const info = state.editingCells.get(getPositionHash(position));
      info.editing = true;
    },
    closeEditor(position: CellPosition) {
      const info = state.editingCells.get(getPositionHash(position));
      info.editing = false;
    },
    close() {
      state.editingCells.clear();
    },
    isEditing(position: CellPosition) {
      return state.editingCells
        .get(getPositionHash(position))
        .editing;
    },
  });

  return context;
}
