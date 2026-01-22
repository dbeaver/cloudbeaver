/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { EditorState, EditorView, IEditorRef } from '@cloudbeaver/plugin-codemirror6';

import { clearActiveQueryHighlight, highlightActiveQuery } from '../ACTIVE_QUERY_EXTENSION.js';
import { setGutter } from '../QUERY_STATUS_GUTTER_EXTENSION.js';

export interface IEditor {
  readonly view: EditorView | null;
  readonly state: EditorState | null;
  highlightActiveQuery: (from: number, to?: number) => void;
  clearActiveQueryHighlight: () => void;
  highlightExecutingLine: (line: number, state: boolean) => void;
  highlightExecutingErrorLine: (line: number, state: boolean) => void;
  resetLineStateHighlight: () => void;
}

export function useSQLCodeEditor(editorRef: IEditorRef | null) {
  const state: IEditor = useObservableRef(
    () => ({
      get view() {
        return this.editorRef?.view ?? null;
      },
      get state() {
        return this.editorRef?.view?.state ?? null;
      },
      highlightActiveQuery(from: number, to?: number) {
        if (!this.view) {
          return;
        }

        // If the 'to' parameter is provided, ensure it doesn't exceed the document length
        if (to && to > this.view.state.doc.length) {
          return;
        }

        highlightActiveQuery(this.view, from, to);
      },
      clearActiveQueryHighlight() {
        if (this.view) {
          clearActiveQueryHighlight(this.view);
        }
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
    }),
    { editorRef: observable.ref },
    { editorRef },
  );

  return state;
}
