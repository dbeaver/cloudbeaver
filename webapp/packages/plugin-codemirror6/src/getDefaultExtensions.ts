/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import { foldGutter, indentOnInput, syntaxHighlighting, bracketMatching } from '@codemirror/language';
import { highlightSelectionMatches } from '@codemirror/search';
import type { Extension } from '@codemirror/state';
import { lineNumbers, highlightSpecialChars, dropCursor, rectangularSelection, crosshairCursor, keymap } from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';

// @TODO allow to configure bindings outside of the component
const DEFAULT_KEY_MAP = defaultKeymap.filter(binding => binding.mac !== 'Ctrl-f');

DEFAULT_KEY_MAP.push(indentWithTab);

/** Provides the necessary extensions to establish a basic editor */
export function getDefaultExtensions(): Extension[] {
  const extensions: Extension[] = [
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
    keymap.of(DEFAULT_KEY_MAP),
  ];

  return extensions;
}