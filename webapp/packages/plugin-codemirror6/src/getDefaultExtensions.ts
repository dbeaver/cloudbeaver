/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EditorView } from 'codemirror6';

import { foldGutter, indentOnInput, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import { EditorState, Extension } from '@codemirror/state';
import { lineNumbers, highlightSpecialChars, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';

export interface IDefaultExtensionsOptions {
  readonly?: boolean;
  editable?: boolean;
}

export function getDefaultExtensions(options: IDefaultExtensionsOptions): Extension[] {
  const extensions: Extension[] = [
    EditorView.lineWrapping, lineNumbers(), highlightSpecialChars(), foldGutter(), indentOnInput(),
    syntaxHighlighting(classHighlighter), bracketMatching(), dropCursor(), rectangularSelection(), crosshairCursor(),
    highlightSelectionMatches(),
  ];

  if (options.editable === false) {
    extensions.push(EditorView.editable.of(false));
  }

  if (options.readonly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  return extensions;
}