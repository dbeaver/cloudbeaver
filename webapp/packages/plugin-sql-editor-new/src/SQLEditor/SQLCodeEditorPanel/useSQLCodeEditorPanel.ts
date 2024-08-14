/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

import type { IEditor } from '../SQLCodeEditor/useSQLCodeEditor';

interface State {
  highlightActiveQuery: () => void;
  onQueryChange: (query: string) => void;
  onCursorChange: (begin: number, end?: number) => void;
}

export function useSQLCodeEditorPanel(data: ISQLEditorData, editor: IEditor) {
  const state: State = useObservableRef(
    () => ({
      highlightActiveQuery() {
        queueMicrotask(() => {
          this.editor.clearActiveQueryHighlight();

          const segment = this.data.activeSegment;

          if (segment) {
            this.editor.highlightActiveQuery(segment.begin, segment.end);
          }
        });
      },
      onQueryChange(query: string) {
        this.data.setScript(query);
      },
      onCursorChange(begin: number, end?: number) {
        this.data.setCursor(begin, end);
        this.highlightActiveQuery();
      },
    }),
    { onQueryChange: action.bound, onCursorChange: action.bound, highlightActiveQuery: action.bound },
    { editor, data },
  );

  useExecutor({
    executor: data.onUpdate,
    handlers: [state.highlightActiveQuery],
  });

  useExecutor({
    executor: data.onExecute,
    handlers: [
      function updateHighlight() {
        editor.resetLineStateHighlight();
      },
    ],
  });

  useExecutor({
    executor: data.onSegmentExecute,
    handlers: [
      function highlightSegment(data) {
        editor.highlightExecutingLine(data.segment.begin, data.type === 'start');

        if (data.type === 'error') {
          editor.highlightExecutingErrorLine(data.segment.begin, true);
        }
      },
    ],
  });

  return state;
}
