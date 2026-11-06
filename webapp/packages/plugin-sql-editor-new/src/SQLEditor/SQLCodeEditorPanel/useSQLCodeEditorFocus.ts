/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect } from 'react';

import type { ISQLEditorData } from '@cloudbeaver/plugin-sql-editor';
import type { IEditor } from '@cloudbeaver/plugin-sql-editor-codemirror';

export function useSQLCodeEditorFocus(data: ISQLEditorData, editor: IEditor, tabId: string): void {
  const model = data.model;
  const request = model.focusRequest;
  const view = editor.view;
  const readonly = data.readonly;
  const selected = data.state.currentModeId === tabId;

  useEffect(() => {
    if (!request || model.focusRequest !== request || data.state.currentModeId !== tabId) {
      return;
    }

    if (!request.canFocus()) {
      model.completeFocusRequest(request);
      return;
    }

    if (view && !readonly) {
      view.focus();
      model.completeFocusRequest(request);
    }
  }, [data, model, request, view, readonly, selected, tabId]);
}
