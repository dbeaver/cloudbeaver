/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EditorView } from 'codemirror6';
import { useEffect, useState } from 'react';

import { EditorState } from '@codemirror/state';

import { getDefaultExtensions } from './getDefaultExtensions';
import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';

export const ReactCodemirror: React.FC<IReactCodeMirrorProps> = function ReactCodemirror({
  value,
  extensions = [],
  readonly,
  editable,
}) {
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  const defaultExtensions = getDefaultExtensions({
    readonly,
    editable,
  });

  const defaultTheme = EditorView.theme({
    '&': {
      width: '100%',
      height: '100%',
    },
  });

  useEffect(() => {
    let view: EditorView | undefined;

    if (ref) {
      const state = EditorState.create({
        doc: value,
        extensions: [...defaultExtensions, defaultTheme, ...extensions],
      });

      view = new EditorView({
        parent: ref,
        state,
      });
    }

    return () => {
      view?.destroy();
    };
  }, [ref]);

  return (
    <div ref={setRef} className='ReactCodemirror' />
  );
};