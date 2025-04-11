/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { MergeView } from '@codemirror/merge';
import { Annotation, Compartment, EditorState, type Extension, StateEffect, type TransactionSpec } from '@codemirror/state';
import { EditorView, ViewUpdate } from '@codemirror/view';
import { observer } from 'mobx-react-lite';
import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';

import { hasInsertProperty } from './hasInsertProperty.js';
import type { IEditorRef } from './IEditorRef.js';
import type { IReactCodeMirrorProps } from './IReactCodemirrorProps.js';
import { type IReactCodemirrorContext, ReactCodemirrorContext } from './ReactCodemirrorContext.js';
import { useCodemirrorExtensions } from './useCodemirrorExtensions.js';
import { validateCursorBoundaries } from './validateCursorBoundaries.js';

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
      copyEventHandler,
      autoFocus,
      onChange,
      onCursorChange,
      onUpdate,
    },
    ref,
  ) {
    value = value ?? getValue?.();
    const currentExtensions = useRef<Map<Compartment, Extension>>(new Map());
    const readOnlyFacet = useMemo(() => {
      if (readonly) {
        return [EditorState.readOnly.of(true), EditorView.editable.of(false), EditorView.contentAttributes.of({ tabIndex: '0' })];
      }

      return [];
    }, [readonly]);
    const eventHandlers = useMemo(
      () =>
        EditorView.domEventHandlers({
          copy: copyEventHandler,
        }),
      [copyEventHandler],
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

        const validatedCursor = cursor ? validateCursorBoundaries(cursor, tempState.doc.length) : undefined;

        if (incomingValue !== undefined) {
          merge = new MergeView({
            a: {
              doc: value,
              selection: validatedCursor,
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
              selection: validatedCursor,
              extensions: [updateListener, ...effects],
            }),
            parent: container,
          });
        }

        if (validatedCursor) {
          if (validatedCursor.anchor > 0 || validatedCursor.head !== validatedCursor.anchor) {
            editorView.dispatch({
              scrollIntoView: true,
            });
          }
        }

        if (incomingView) {
          setIncomingView(incomingView);
        }
        setView(editorView);
        currentExtensions.current = extensions;

        editorView.dom.addEventListener('keydown', event => {
          const newEvent = new KeyboardEvent('keydown', event);

          // we handle undo/redo on the CaptureView level
          if ((newEvent.metaKey || newEvent.ctrlKey) && ['z', 'y'].includes(newEvent.key.toLowerCase())) {
            return;
          }

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

        if (cursor) {
          const changed = view.state.selection.main.anchor !== cursor.anchor || view.state.selection.main.head !== cursor.head;

          if (changed && isCursorInDoc) {
            transaction.selection = cursor;
          }
        }

        if (hasInsertProperty(transaction.changes) && !transaction.selection) {
          transaction.selection = {
            anchor: transaction.changes.insert?.length ?? 0,
            head: transaction.changes.insert?.length ?? 0,
          };
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
