/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { MergeView } from '@codemirror/merge';
import { Annotation, Compartment, EditorState, Extension, StateEffect, TransactionSpec } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { observer } from 'mobx-react-lite';
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import type { IEditorRef } from './IEditorRef';
import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';
import { type IReactCodemirrorContext, ReactCodemirrorContext } from './ReactCodemirrorContext';
import { useCodemirrorExtensions } from './useCodemirrorExtensions';
import { validateCursorBoundaries } from './validateCursorBoundaries';

const External = Annotation.define<boolean>();

export const ReactCodemirror = observer<IReactCodeMirrorProps, IEditorRef>(
  forwardRef(function ReactCodemirror(
    {
      children,
      getValue,
      value,
      cursor,
      incomingValue,
      extensions = new Map<Compartment, Extension>(),
      readonly,
      disableCopy,
      autoFocus,
      onChange,
      onCursorChange,
      onUpdate,
    },
    ref,
  ) {
    value = value ?? getValue?.();
    const currentExtensions = useRef<Map<Compartment, Extension>>(new Map());
    const readOnlyFacet = useMemo(() => EditorView.editable.of(!readonly), [readonly]);
    const eventHandlers = useMemo(
      () =>
        EditorView.domEventHandlers({
          copy() {
            return disableCopy;
          },
        }),
      [disableCopy],
    );
    extensions = useCodemirrorExtensions(extensions, [readOnlyFacet, eventHandlers]);
    const [container, setContainer] = useState<HTMLDivElement | null>(null);
    const [view, setView] = useState<EditorView | null>(null);
    const [incomingView, setIncomingView] = useState<EditorView | null>(null);
    const callbackRef = useObjectRef({ onChange, onCursorChange, onUpdate });

    useLayoutEffect(() => {
      if (container) {
        const updateListener = EditorView.updateListener.of((update: ViewUpdate) => {
          const remote = update.transactions.some(tr => tr.annotation(External));

          if (update.docChanged && !remote) {
            const doc = update.state.doc;
            const value = doc.toString();

            callbackRef.onChange?.(value, update);
          }

          if (update.selectionSet && !remote) {
            const selection = update.state.selection.main;
            callbackRef.onCursorChange?.(selection, update);
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

        const tempState = EditorState.create({
          doc: value,
        });

        if (incomingValue !== undefined) {
          merge = new MergeView({
            a: {
              doc: value,
              selection: cursor && validateCursorBoundaries(cursor, tempState.doc.length),
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
            state: EditorState.create({
              doc: value,
              selection: cursor && validateCursorBoundaries(cursor, tempState.doc.length),
              extensions: [updateListener, ...effects],
            }),
            parent: container,
          });
        }

        editorView.dispatch({
          scrollIntoView: true,
        });

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
      if (view) {
        const transaction: TransactionSpec = { annotations: [External.of(true)] };

        let isCursorInDoc = cursor && cursor.anchor > 0 && cursor.anchor < view.state.doc.length;

        if (value !== undefined) {
          const newText = view.state.toText(value);

          if (!newText.eq(view.state.doc)) {
            transaction.changes = { from: 0, to: view.state.doc.length, insert: newText };
            isCursorInDoc = cursor && cursor.anchor > 0 && cursor.anchor < newText.length;
          }
        }

        if (cursor && isCursorInDoc && (view.state.selection.main.anchor !== cursor.anchor || view.state.selection.main.head !== cursor.head)) {
          transaction.selection = cursor;
        }

        if (transaction.changes || transaction.selection) {
          view.dispatch(transaction);
        }
      }
    });

    useLayoutEffect(() => {
      if (incomingValue !== undefined && incomingView) {
        const newValue = incomingView.state.toText(incomingValue);

        if (!newValue.eq(incomingView.state.doc)) {
          incomingView.dispatch({
            changes: { from: 0, to: incomingView.state.doc.length, insert: newValue },
          });
        }
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
      }),
      [container, view],
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
