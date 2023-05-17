/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { throttle } from '@cloudbeaver/core-utils';
import type { ViewUpdate, Transaction } from '@cloudbeaver/plugin-codemirror6';
import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';

import type { IEditor } from '../SQLCodeEditor/useSQLCodeEditor';

interface State {
  highlightActiveQuery: () => void;
  onQueryChange: (query: string) => void;
  onUpdate: (update: ViewUpdate) => void;
}

export function useSQLCodeEditorPanel(data: ISQLEditorData, editor: IEditor) {

  const state: State = useObservableRef(() => ({
    highlightActiveQuery() {
      this.editor.clearActiveQueryHighlight();

      const segment = this.data.activeSegment;

      if (segment) {
        this.editor.highlightActiveQuery(segment.begin, segment.end);
      }
    },
    onQueryChange(query: string) {
      this.data.setQuery(query);
    },
    onUpdate(update: ViewUpdate) {
      const transactions = update.transactions.filter(t => t.selection !== undefined);
      const lastTransaction = transactions[transactions.length - 1] as Transaction | undefined;

      if (lastTransaction) {
        const from = lastTransaction.selection?.main.from ?? update.state.selection.main.from;
        const to = lastTransaction.selection?.main.to ?? update.state.selection.main.to;

        this.data.setCursor(from, to);
      }
    },

  }), {}, { editor, data }, ['onQueryChange', 'onUpdate']);

  const updateHighlight = useCallback(throttle(() => state.highlightActiveQuery(), 1000), [state]);

  useExecutor({
    executor: data.onUpdate,
    handlers: [updateHighlight],
  });

  useExecutor({
    executor: data.onExecute,
    handlers: [function updateHighlight() {
      editor.resetLineStateHighlight();
    }],
  });

  useExecutor({
    executor: data.onSegmentExecute,
    handlers: [function highlightSegment(data) {
      editor.highlightExecutingLine(data.segment.begin, data.type === 'start');

      if (data.type === 'error') {
        editor.highlightExecutingErrorLine(data.segment.begin, true);
      }
    }],
  });

  return state;
}