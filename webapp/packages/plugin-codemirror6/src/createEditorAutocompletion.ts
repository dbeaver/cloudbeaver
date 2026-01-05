/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { Compartment, type Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';

export type CompletionConfig = Parameters<typeof autocompletion>[0];

const EDITOR_AUTOCOMPLETION_COMPARTMENT = new Compartment();

const EDITOR_AUTOCOMPLETION_KEYMAP = keymap.of([
  { key: 'Alt-Space', run: startCompletion, preventDefault: true },
  { key: 'Shift-Ctrl-Space', run: startCompletion, preventDefault: true },
]);

export function createEditorAutocompletion(config?: CompletionConfig): [Compartment, Extension] {
  return [
    EDITOR_AUTOCOMPLETION_COMPARTMENT,
    [
      EDITOR_AUTOCOMPLETION_KEYMAP,
      autocompletion({
        ...config,
      }),
    ],
  ];
}
