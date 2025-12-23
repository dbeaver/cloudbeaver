/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Decoration, EditorView, ViewPlugin, ViewUpdate, WidgetType, type DecorationSet } from '@codemirror/view';

class NewlineWidget extends WidgetType {
  toDOM() {
    const span = document.createElement('span');
    span.className = 'cm-newline';
    span.textContent = '↵';
    return span;
  }
}

export function highlightNewLine() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = this.getDecorations(view);
      }

      getDecorations(view: EditorView) {
        const widgets = [];
        const lastLineNumber = view.state.doc.lines;
        for (const { from, to } of view.visibleRanges) {
          for (let pos = from; pos <= to; ) {
            const line = view.state.doc.lineAt(pos);

            if (line.number < lastLineNumber) {
              widgets.push(Decoration.widget({ widget: new NewlineWidget(), side: 1 }).range(line.to));
            }

            pos = line.to + 1;
          }
        }
        return Decoration.set(widgets, true);
      }

      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = this.getDecorations(update.view);
        }
      }
    },
    {
      decorations: v => v.decorations,
    },
  );
}
