/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { autocompletion, startCompletion } from '@codemirror/autocomplete';
import type { Extension } from '@codemirror/state';
import { keymap } from '@codemirror/view';
import { useMemo, useState } from 'react';

export type CompletionConfig = Parameters<typeof autocompletion>[0];

export function useEditorAutocompletion(config?: CompletionConfig): Extension[] {
  const [autocompleteKeyMap] = useState(() =>
    keymap.of([
      { key: 'Alt-Space', run: startCompletion, preventDefault: true },
      { key: 'Shift-Ctrl-Space', run: startCompletion, preventDefault: true },
    ]),
  );

  const autocompletionExtension = useMemo(
    () =>
      autocompletion({
        ...config,
        closeOnBlur: false,
      }),
    [config],
  );

  return [autocompletionExtension, autocompleteKeyMap];
}
