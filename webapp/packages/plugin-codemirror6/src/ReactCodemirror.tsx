/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EditorView } from 'codemirror6';
import { observer } from 'mobx-react-lite';
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { Annotation, StateEffect } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';

import type { IEditorRef } from './IEditorRef';
import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';

const External = Annotation.define<boolean>();

const defaultTheme = EditorView.theme({
  '&': {
    width: '100%',
    height: '100%',
  },
});

export const ReactCodemirror = observer<IReactCodeMirrorProps, IEditorRef>(forwardRef(function ReactCodemirror({
  getValue,
  value,
  extensions,
  readonly,
  autoFocus,
  onChange,
  onUpdate,
}, ref) {
  value = value ?? getValue?.();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [view, setView] = useState<EditorView | null>(null);
  const lastValueUpdate = useRef<string | undefined>(undefined);

  const ext = [defaultTheme];
  const callbackRef = useObjectRef({ onChange, onUpdate });

  if (readonly) {
    ext.push(EditorView.editable.of(false));
  }

  if (extensions) {
    ext.push(extensions);
  }

  const updateListener = useMemo(() => EditorView.updateListener.of((update: ViewUpdate) => {
    const remote = update.transactions.some(tr => tr.annotation(External));

    if (update.docChanged && !remote) {
      const doc = update.state.doc;
      const value = doc.toString();

      lastValueUpdate.current = value;
      callbackRef.onChange?.(value, update);
    }

    callbackRef.onUpdate?.(update);
  }), []);

  ext.push(updateListener);

  useLayoutEffect(() => {
    if (container) {
      const ev = new EditorView({
        parent: container,
      });

      setView(ev);

      ev.dom.addEventListener('keydown', event => {
        const newEvent = new KeyboardEvent('keydown', event);
        document.dispatchEvent(newEvent);
      });

      return () => {
        ev.destroy();
        setView(null);
      };
    }

    return () => { };
  }, [container]);

  useLayoutEffect(() => {
    if (view && value !== lastValueUpdate.current) {
      lastValueUpdate.current = value;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: [External.of(true)],
      });
    }
  }, [value, view]);

  useLayoutEffect(() => {
    if (view) {
      view.dispatch({ effects: StateEffect.reconfigure.of(ext) });
    }
  });

  useLayoutEffect(() => {
    if (!readonly && autoFocus && view) {
      view.focus();
    }
  }, [autoFocus, view, readonly]);

  useImperativeHandle(ref, () => ({
    container,
    view,
  }), [container, view]);

  return (
    <div ref={setContainer} className='ReactCodemirror' />
  );
}));