/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObservableRef } from '@cloudbeaver/core-blocks';
import { classEffect, clearClassesEffect, Decoration, IEditorRef } from '@cloudbeaver/plugin-codemirror6';

import { setGutter } from '../QUERY_GUTTER';

export interface IEditor {
  readonly view: IEditorRef['view'];
  readonly state: IEditorRef['state'];
  highlightActiveQuery: (from: number | true, to?: number) => void;
  highlightExecutingLine: (line: number, state: boolean) => void;
  highlightExecutingErrorLine: (line: number, state: boolean) => void;
  resetLineStateHighlight: () => void;
  clearClasses: () => void;
}

const ACTIVE_QUERY_DECORATION = Decoration.mark({
  class: 'active-query',
});

export function useSQLCodeEditor(editorRef: IEditorRef | null) {
  const state: IEditor = useObservableRef(() => ({
    get view() {
      return this.editorRef?.view ?? null;
    },
    get state() {
      return this.editorRef?.state ?? null;
    },
    highlightActiveQuery(from: number | true, to?: number) {
      if (from === true) {
        this.clearClasses();
        return;
      }

      this.view?.dispatch({
        effects: classEffect.of([ACTIVE_QUERY_DECORATION.range(from, to)]),
      });
    },
    highlightExecutingLine(line: number, state: boolean) {
      if (this.view) {
        setGutter(this.view, line, 'run', state);
      }
    },
    highlightExecutingErrorLine(line: number, state: boolean) {
      if (this.view) {
        setGutter(this.view, line, 'error', state);
      }
    },
    resetLineStateHighlight() {
      if (this.view) {
        setGutter(this.view, 0, 'run', false);
        setGutter(this.view, 0, 'error', false);
      }
    },
    clearClasses() {
      this.view?.dispatch({ effects: clearClassesEffect.of(null) });
    },
  }), {}, { editorRef });

  return state;
}