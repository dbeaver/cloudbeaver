/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EditorView } from 'codemirror6';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useState } from 'react';

import { EditorState, Annotation, StateEffect } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';

import { getDefaultExtensions } from './getDefaultExtensions';
import type { IEditorRef } from './IEditorRef';
import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';

const External = Annotation.define<boolean>();

export const ReactCodemirror = forwardRef<IEditorRef, IReactCodeMirrorProps>(function ReactCodemirror({
  value,
  extensions = [],
  readonly,
  editable,
  autoFocus,
  onChange,
  onUpdate,
}, ref) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [view, setView] = useState<EditorView | null>(null);
  const [state, setState] = useState<EditorState | null>(null);

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

  const ext = [...defaultExtensions, defaultTheme, ...extensions];

  const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
    const remote = update.transactions.some(tr => tr.annotation(External));

    if (update.docChanged && !remote) {
      const doc = update.state.doc;
      const value = doc.toString();

      onChange?.(value, update);
    }

    onUpdate?.(update);
  });

  if (onChange || onUpdate) {
    ext.push(updateListener);
  }

  useEffect(() => {
    if (container) {
      const es = EditorState.create({
        doc: value,
        extensions: ext,
      });

      const ev = new EditorView({
        parent: container,
        state: es,
      });

      setState(es);
      setView(ev);

      return () => {
        ev.destroy();
        setState(null);
        setView(null);
      };
    }

    return () => { };
  }, [container]);

  useEffect(() => {
    const currentValue = view?.state.doc.toString() ?? '';

    if (view && value !== currentValue) {
      view.dispatch({
        changes: { from: 0, to: currentValue.length, insert: value },
        annotations: [External.of(true)],
      });
    }
  }, [value, view]);

  useEffect(() => {
    if (view) {
      view.dispatch({ effects: StateEffect.reconfigure.of(ext) });
    }
  }, [extensions, readonly, editable, onChange, onUpdate]);

  useLayoutEffect(() => {
    if (autoFocus && view) {
      view.focus();
    }
  }, [autoFocus, view]);

  useImperativeHandle(ref, () => ({
    container,
    view,
    state,
  }), [container, view, state]);

  return (
    <div ref={setContainer} className='ReactCodemirror' />
  );
});