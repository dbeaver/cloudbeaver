/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { acceptCompletion, autocompletion, startCompletion } from '@codemirror/autocomplete';
import { Compartment, Prec, type Extension } from '@codemirror/state';
import { keymap, type KeyBinding } from '@codemirror/view';

export type CompletionConfig = Parameters<typeof autocompletion>[0];

// Shortcuts are case sensitive
export const EDITOR_START_COMPLETION_KEYBINDING: KeyBinding = {
  win: 'Mod-Space',
  linux: 'Mod-Space',
  mac: 'Mod-Shift-Space',
  run: startCompletion,
  preventDefault: true,
};
export const EDITOR_ACCEPT_COMPLETION_KEYBINDING: KeyBinding = {
  key: 'Tab',
  run: acceptCompletion,
  preventDefault: true,
};
export const EDITOR_ACCEPT_COMPLETION_ALTERNATIVE_KEYBINDING: KeyBinding = {
  key: 'Enter',
  run: acceptCompletion,
  preventDefault: true,
};

const EDITOR_AUTOCOMPLETION_COMPARTMENT = new Compartment();

const EDITOR_AUTOCOMPLETION_KEYMAP = Prec.high(
  keymap.of([EDITOR_START_COMPLETION_KEYBINDING, EDITOR_ACCEPT_COMPLETION_KEYBINDING, EDITOR_ACCEPT_COMPLETION_ALTERNATIVE_KEYBINDING]),
);

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
