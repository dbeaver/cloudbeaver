/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { EditorState } from '@codemirror/state';
import type { EditorView } from '@codemirror/view';

export interface IEditorRef {
  container: HTMLDivElement | null;
  state: EditorState | null;
  view: EditorView | null;
}