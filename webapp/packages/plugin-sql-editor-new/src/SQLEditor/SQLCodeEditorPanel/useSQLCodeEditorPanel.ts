/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';
import { useCallback } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { throttle } from '@cloudbeaver/core-utils';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

import type { IEditor } from '@cloudbeaver/plugin-sql-editor-codemirror';
import type { SelectionRange } from '@cloudbeaver/plugin-codemirror6';

interface State {
  highlightActiveQuery: () => void;
  onQueryChange: (query: string, selection: SelectionRange) => void;
  onCursorChange: (anchor: number, head?: number) => void;
}

export const ON_QUERY_CHANGE_SOURCE = 'QueryChange';

export function useSQLCodeEditorPanel(data: ISQLEditorData, editor: IEditor) {
  const state: State = useObservableRef(
    () => ({
      highlightActiveQuery() {
        this.editor.clearActiveQueryHighlight();

        const segment = this.data.model.cursorSegment;

        if (segment) {
          this.editor.highlightActiveQuery(segment.begin, segment.end);
        }
      },
      onQueryChange(query: string, selection: SelectionRange) {
        this.data.setScript(query, ON_QUERY_CHANGE_SOURCE, { anchor: selection.anchor, head: selection.head }); // do not pass selection directly because anchor and head are getters
      },
      onCursorChange(anchor: number, head?: number) {
        this.data.setCursor(anchor, head);
      },
    }),
    { onQueryChange: action.bound, onCursorChange: action.bound },
    { editor, data },
  );

  const updateHighlight = useCallback(
    throttle(() => state.highlightActiveQuery(), 1000),
    [state],
  );

  useExecutor({
    executor: data.model.onUpdate,
    handlers: [updateHighlight],
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
