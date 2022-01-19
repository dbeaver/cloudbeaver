/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { useState } from 'react';

import { useObservableRef } from '@cloudbeaver/core-blocks';
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
  onEdit: (position: CellPosition, code?: string, key?: string) => boolean;
  onCloseEditor?: (position: CellPosition) => void;
}

export function useEditing(options: IEditingOptions): IEditingContext {
  const state = useObservableRef(() => ({
    editingCells: new MetadataMap<string, IEditingState>(() => ({ editing: false })),
    editorOpened: false,
  }), {
    editorOpened: observable.ref,
    readonly: observable.ref,
  }, { options, readonly: !!options.readonly });

  const [context] = useState<IEditingContext>({
    get readonly() {
      return state.readonly;
    },
    edit(position: CellPosition, code?: string, key?: string) {
      if (state.options.readonly) {
        return;
      }

      if (!state.options.onEdit(position, code, key)) {
        return;
      }

      state.editingCells.clear();
      const info = state.editingCells.get(getPositionHash(position));
      info.editing = true;
      state.editorOpened = true;
    },
    closeEditor(position: CellPosition) {
      const info = state.editingCells.get(getPositionHash(position));

      if (!info.editing) {
        return;
      }

      info.editing = false;
      state.editorOpened = false;

      state.options.onCloseEditor?.(position);
    },
    close() {
      state.editingCells.clear();
      state.editorOpened = false;
    },
    isEditorActive() {
      return state.editorOpened;
    },
    isEditing(position: CellPosition) {
      return state.editingCells
        .get(getPositionHash(position))
        .editing;
    },
  });

  return context;
}
