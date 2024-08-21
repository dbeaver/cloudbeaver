/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';
import { useCallback } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { debounce } from '@cloudbeaver/core-utils';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

import type { IEditor } from '../SQLCodeEditor/useSQLCodeEditor';

interface State {
  highlightActiveQuery: () => void;
  onQueryChange: (query: string) => void;
  onCursorChange: (begin: number, end?: number) => void;
}

export function useSQLCodeEditorPanel(data: ISQLEditorData, editor: IEditor) {
  const script = data.dataSource?.script;

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
      },
    }),
    { onQueryChange: action.bound, onCursorChange: action.bound },
    { editor, data },
  );

  const updateHighlight = useCallback(
    debounce(() => state.highlightActiveQuery(), 300),
    [state],
  );

  function onUpdate() {
    const newScript = data.dataSource?.script;
    const isScriptChanged = script !== newScript;

    editor.clearActiveQueryHighlight();

    if (!isScriptChanged) {
      updateHighlight();
    }
  }

  useExecutor({
    executor: data.onUpdate,
    handlers: [onUpdate],
  });

  useExecutor({
    executor: data.dataSource?.onUpdate,
    handlers: [onUpdate],
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
