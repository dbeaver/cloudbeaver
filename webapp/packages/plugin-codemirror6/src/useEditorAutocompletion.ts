/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import { Compartment, type Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { useMemo } from 'react';

export type CompletionConfig = Parameters<typeof autocompletion>[0];

const EDITOR_AUTOCOMPLETION_COMPARTMENT = new Compartment();
const AUTO_COMPLETE_DELAY = 300;

const EDITOR_AUTOCOMPLETION_KEYMAP = keymap.of([
  { key: 'Alt-Space', run: startCompletion, preventDefault: true },
  { key: 'Shift-Ctrl-Space', run: startCompletion, preventDefault: true },
]);

export function useEditorAutocompletion(config?: CompletionConfig): [Compartment, Extension] {
  const autocompletionExtension = useMemo(
    () => [
      EDITOR_AUTOCOMPLETION_KEYMAP,
      autocompletion({
        ...config,
        activateOnTypingDelay: AUTO_COMPLETE_DELAY,
        closeOnBlur: false,
      }),
    ],
    [config],
  );

  return [EDITOR_AUTOCOMPLETION_COMPARTMENT, autocompletionExtension];
}
