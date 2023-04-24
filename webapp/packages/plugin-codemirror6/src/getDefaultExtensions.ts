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
import type { Extension } from '@codemirror/state';
import { lineNumbers, highlightSpecialChars, dropCursor, rectangularSelection, crosshairCursor } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';

/** Provides the necessary extensions to establish a basic editor */
export function getDefaultExtensions(): Extension[] {
  const extensions: Extension[] = [
    EditorView.lineWrapping,
    lineNumbers(),
    highlightSpecialChars(),
    highlightSelectionMatches(),
    syntaxHighlighting(classHighlighter),
    bracketMatching(),
    dropCursor(),
    crosshairCursor(),
    foldGutter(),
    indentOnInput(),
    rectangularSelection(),
  ];

  return extensions;
}