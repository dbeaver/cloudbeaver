/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { MergeView } from '@codemirror/merge';
import { Annotation, Compartment, Extension, StateEffect } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { observer } from 'mobx-react-lite';
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { IEditorRef } from './IEditorRef';
import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';
import { type IReactCodemirrorContext, ReactCodemirrorContext } from './ReactCodemirrorContext';
import { useCodemirrorExtensions } from './useCodemirrorExtensions';

const External = Annotation.define<boolean>();

export const ReactCodemirror = observer<IReactCodeMirrorProps, IEditorRef>(
  forwardRef(function ReactCodemirror(
    { children, getValue, value, incomingValue, extensions = new Map<Compartment, Extension>(), readonly, autoFocus, onChange, onUpdate },
    ref,
  ) {
    value = value ?? getValue?.();
    const currentExtensions = useRef<Map<Compartment, Extension>>(new Map());
    const readOnlyFacet = useMemo(() => EditorView.editable.of(!readonly), [readonly]);
    extensions = useCodemirrorExtensions(extensions, readOnlyFacet);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [view, setView] = useState<EditorView | null>(null);
    const [incomingView, setIncomingView] = useState<EditorView | null>(null);
    const callbackRef = useObjectRef({ onChange, onUpdate });
    const [selection, setSelection] = useState(view?.state.selection.main ?? null);

    useLayoutEffect(() => {
      if (container) {
        const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
          const remote = update.transactions.some(tr => tr.annotation(External));
          if (update.selectionSet) {
            setSelection(update.state.selection.main);
          }

          if (update.docChanged && !remote) {
            const doc = update.state.doc;
            const value = doc.toString();

            callbackRef.onChange?.(value, update);
          }

          callbackRef.onUpdate?.(update);
        });

        let editorView: EditorView;
        let incomingView: EditorView | undefined;
        let merge: MergeView | undefined;

        const effects: Extension[] = [];
        for (const [compartment, extension] of extensions) {
          effects.push(compartment.of(extension));
        }

        if (incomingValue !== undefined) {
          merge = new MergeView({
            a: {
              extensions: [updateListener, ...effects],
            },
            b: {
              extensions: [EditorView.editable.of(false), ...effects],
            },
            parent: container,
          });

          editorView = merge.a;
          incomingView = merge.b;
        } else {
          editorView = new EditorView({
            parent: container,
            extensions: [updateListener, ...effects],
          });
        }

        if (incomingView) {
          setIncomingView(incomingView);
        }
        setView(editorView);
        currentExtensions.current = extensions;

        editorView.dom.addEventListener('keydown', event => {
          const newEvent = new KeyboardEvent('keydown', event);
          document.dispatchEvent(newEvent);
        });

        return () => {
          editorView.destroy();
          merge?.destroy();
          setView(null);
          setIncomingView(null);
        };
      }

      return () => {};
    }, [container, incomingValue !== undefined]);

    useLayoutEffect(() => {
      if (!view) {
        return;
      }

      const effects: StateEffect<any>[] = [];
      for (const [compartment, extension] of extensions) {
        if (currentExtensions.current.get(compartment) !== extension) {
          if (compartment.get(view.state) === undefined) {
            effects.push(StateEffect.appendConfig.of(compartment.of(extension)));
          } else {
            effects.push(compartment.reconfigure(extension));
          }
        }
      }

      for (const compartment of currentExtensions.current.keys()) {
        if (!extensions.has(compartment)) {
          effects.push(compartment.reconfigure([]));
        }
      }

      view.dispatch({ effects });

      if (incomingView) {
        incomingView.dispatch({ effects });
      }

      currentExtensions.current = extensions;
    });

    useLayoutEffect(() => {
      if (value !== undefined && view && value !== view.state.doc.toString()) {
        view.dispatch({
          changes: { from: 0, to: view.state.doc.length, insert: value },
          annotations: [External.of(true)],
        });
      }
    }, [value, view]);

    useLayoutEffect(() => {
      if (incomingValue !== undefined && incomingView && incomingValue !== incomingView.state.doc.toString()) {
        incomingView.dispatch({
          changes: { from: 0, to: incomingView.state.doc.length, insert: incomingValue },
        });
      }
    }, [incomingValue, incomingView]);

    useLayoutEffect(() => {
      if (!readonly && autoFocus && view) {
        view.focus();
      }
    }, [autoFocus, view, readonly]);

    useImperativeHandle(
      ref,
      () => ({
        container,
        view,
        selection,
      }),
      [container, view, selection],
    );

    const context = useMemo<IReactCodemirrorContext>(
      () => ({
        view,
        incomingView,
      }),
      [view, incomingView],
    );

    return (
      <ReactCodemirrorContext.Provider value={context}>
        <div ref={setContainer} className="ReactCodemirror">
          {children}
        </div>
      </ReactCodemirrorContext.Provider>
    );
  }),
);
