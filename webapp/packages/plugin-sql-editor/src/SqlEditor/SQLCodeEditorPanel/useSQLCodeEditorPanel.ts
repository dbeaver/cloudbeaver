/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type {
  EditorConfiguration,
  Editor,
  EditorChange,
  Position,
  Hints,
  ShowHintOptions,
} from 'codemirror';
import { action } from 'mobx';
import { useCallback } from 'react';
import type { IControlledCodeMirror } from 'react-codemirror2';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { throttle } from '@cloudbeaver/core-utils';

import type { ISQLEditorData } from '../ISQLEditorData';
import type { SQLCodeEditorController } from '../SQLCodeEditor/SQLCodeEditorController';

declare module 'codemirror' {
  interface ShowHintOptions  {
    manual: boolean;
  }
}

interface ISQLCodeEditorPanelData {
  readonly activeSuggest: boolean;
  readonly bindings: Omit<IControlledCodeMirror, 'value'>;
  closeHint(): void;
}

interface ISQLCodeEditorPanelDataPrivate extends ISQLCodeEditorPanelData {
  data: ISQLEditorData;
  controller: SQLCodeEditorController | null;
  readonly options: EditorConfiguration;
  handleQueryChange(editor: Editor, data: EditorChange, query: string): void;
  handleEditorConfigure(editor: Editor): void;
  showHint(activeSuggest: boolean): Promise<void>;
  getHandleAutocomplete(editor: Editor, options: ShowHintOptions): Promise<Hints | undefined>;
  highlightActiveQuery(): void;
}

const CLOSE_CHARACTERS = /[\s()[\]{};:>,=\\*]/;

export function useSQLCodeEditorPanel(
  data: ISQLEditorData,
  controller: SQLCodeEditorController | null
): ISQLCodeEditorPanelData {
  const localizationService = useService(LocalizationService);
  const editorPanelData = useObservableRef<ISQLCodeEditorPanelDataPrivate>(() => ({
    activeSuggest: true,
    options: {
      theme: 'material',
      lineNumbers: true,
      indentWithTabs: true,
      smartIndent: true,
      autofocus: true,
      showHint: true,
      undoDepth: 0,
      extraKeys: {
        // Execute sql script
        // 'Ctrl-Enter': () => { editorPanelData.data.executeQuery(); },
        // Execute sql script in new tab
        // 'Ctrl-\\': () => { editorPanelData.data.executeQueryNewTab(); },
        // 'Shift-Ctrl-Enter': () => { editorPanelData.data.executeQueryNewTab(); },
        // 'Shift-Ctrl-E': () => { editorPanelData.data.showExecutionPlan(); },
        // 'Shift-Ctrl-F': () => { editorPanelData.data.formatScript(); },

        // 'Alt-X': () => { editorPanelData.data.executeScript(); },

        // Autocomplete
        'Ctrl-Space': () => { editorPanelData.showHint(true); }, // classic for windows, linux
        'Shift-Ctrl-Space': () => { editorPanelData.showHint(true); },
        'Alt-Space': () => { editorPanelData.showHint(true); }, // workaround for binded 'Ctrl-Space' by input switch in macOS
      },
    },
    bindings: {
      get options(): EditorConfiguration {
        return editorPanelData.options;
      },
      onBeforeChange(
        editor: Editor,
        data: EditorChange,
        query: string
      ) {
        editorPanelData.handleQueryChange(
          editor,
          data,
          query
        );
      },
      editorDidMount(editor) {
        editorPanelData.handleEditorConfigure(editor);
      },
    },

    handleQueryChange(editor: Editor, data: EditorChange, query: string) {
      if (this.data.readonly) {
        (data as any).cancel(); // seems it doesn't works, after disabling read-only mode, typings appears
        return;
      }

      this.data.setQuery(query);
    },

    handleEditorConfigure(editor: Editor) {
      let cursor: Position = editor.getCursor('from');
      const cursorPosition = getAbsolutePosition(editor, cursor);
      this.data.setCursor(cursorPosition);

      const ignoredChanges = ['+delete', 'undo', 'complete'];
      const updateHighlight = throttle(() => this.highlightActiveQuery(), 1000);
      const resetLineStateHighlight = throttle(() => this.controller?.resetLineStateHighlight(), 1000);

      // TODO: probably should be moved to SQLCodeEditorController
      editor.on('changes', (cm, changes) => {
        editor.scrollIntoView(editor.getCursor());

        const nextCursor = editor.getCursor('from');

        if (this.data.parser.isEndsWithDelimiter(getAbsolutePosition(cm, nextCursor))) {
          this.data.updateParserScriptsThrottle();
        }

        resetLineStateHighlight();
        if (!this.activeSuggest) {
          return;
        }

        const lastChange = changes[changes.length - 1];
        const origin = lastChange.origin || '';
        const change = lastChange.text[0] || '';

        if (nextCursor.line !== lastChange.from.line) {
          this.closeHint();
          return;
        }

        if (
          editor.state.completionActive
          || ignoredChanges.includes(origin)
          || editor.state.completionActive?.closeCharacters?.test(change)
          || CLOSE_CHARACTERS.test(change)) {
          return;
        }

        this.showHint(false);
      });

      // TODO: probably should be moved to SQLCodeEditorController
      editor.on('cursorActivity', () => {
        const from = editor.getCursor('from');
        const to = editor.getCursor('to');

        const begin = getAbsolutePosition(editor, from);
        const end = getAbsolutePosition(editor, to);

        this.data.setCursor(begin, end);

        if (editor.state.completionActive) {
          if (from.ch !== cursor.ch || from.line !== cursor.line) {
            const ch = from.ch > cursor.ch
              ? editor.getRange(cursor, from)
              : editor.getRange(from, cursor);


            if (CLOSE_CHARACTERS.test(ch) || from.line !== cursor.line) {
              this.closeHint();
            } else {
              editor.state.completionActive.update();
            }
          }
        }
        cursor = from;
        updateHighlight();
      });

      this.highlightActiveQuery();
    },

    closeHint() {
      const editor = this.controller?.getEditor();

      if (!editor) {
        return;
      }

      editor.closeHint();
    },

    async showHint(manual: boolean) {
      const editor = this.controller?.getEditor();

      if (!editor) {
        return;
      }

      if (editor.state.completionActive && editor.state.completionActive.options.manual === manual) {
        return;
      }

      editor.showHint({
        manual,
        completeSingle: manual,
        updateOnCursorActivity: false,
        closeCharacters: CLOSE_CHARACTERS,
        hint: this.getHandleAutocomplete.bind(this),
      });
    },

    async getHandleAutocomplete(editor: Editor, options: ShowHintOptions): Promise<Hints | undefined> {
      const cursorFrom = editor.getCursor('from');
      const [from, to, leftWordPart, word] = getWordRange(editor, cursorFrom);

      const cursorPosition = getAbsolutePosition(editor, cursorFrom);
      const proposals = await editorPanelData.data.getHintProposals(cursorPosition, leftWordPart, !options.manual);

      const hasSameName = proposals.some(
        ({ displayString }) => displayString.toLocaleLowerCase() === word.toLocaleLowerCase()
      );
      const filteredProposals = proposals.filter(({ displayString }) => (
        word === '*'
        || (
          displayString.toLocaleLowerCase() !== word.toLocaleLowerCase()
          && displayString.toLocaleLowerCase().startsWith(leftWordPart.toLocaleLowerCase())
        )
      ));

      const hints: Hints = {
        from,
        to,
        list: filteredProposals.map(({ displayString, replacementString }) => ({
          text: replacementString,
          displayText: displayString,
        })),
      };

      if (hints.list.length === 0 && !hasSameName && options.manual) {
        hints.list = [{
          text: word,
          displayText: localizationService.translate('sql_editor_hint_empty'),
        }];

        if (options.completeSingle) {
          editor.showHint({
            manual: options.manual,
            completeSingle: false,
            updateOnCursorActivity: false,
            closeCharacters: CLOSE_CHARACTERS,
            hint: this.getHandleAutocomplete.bind(this),
          });
          return;
        }
      }

      if (hints.list.length === 0) {
        this.closeHint();
        return;
      }

      return hints;
    },

    highlightActiveQuery() {
      this.controller?.highlightSegment(true);

      const segment = this.data.activeSegment;

      if (segment) {
        this.controller?.highlightSegment(
          { line: segment.from, ch: segment.fromPosition },
          { line: segment.to, ch: segment.toPosition }
        );
      }
    },
  }), {
    handleEditorConfigure: action.bound,
  }, {
    data, controller,
  });

  const updateHighlight = useCallback(throttle(() => editorPanelData.highlightActiveQuery(), 1000), [editorPanelData]);

  useExecutor({
    executor: data.onUpdate,
    handlers: [updateHighlight],
  });

  useExecutor({
    executor: data.onExecute,
    handlers: [function updateHighlight() {
      editorPanelData.closeHint();
      controller?.resetLineStateHighlight();
    }],
  });

  useExecutor({
    executor: data.onSegmentExecute,
    handlers: [function highlightSegment(data) {
      controller?.highlightExecutingLine(data.segment.from, data.type === 'start');

      if (data.type === 'error') {
        controller?.highlightExecutingErrorLine(data.segment.from, true);
      }
    }],
  });

  return editorPanelData;
}

function getAbsolutePosition(editor: Editor, position: Position) {
  return editor.getRange({ line: 0, ch: 0 }, position).length;
}

function getWordRange(editor: Editor, position: Position): [Position, Position, string, string] {
  const line = editor.getLine(position.line);

  const leftSubstr = line.substring(0, position.ch);
  const rightSubstr = line.substring(position.ch);
  const leftWord = /[^\s()[\]{};:>,.=]+$/.exec(leftSubstr) || [''];
  const rightWord = /^[^\s()[\]{};:>,.=]+/.exec(rightSubstr) || [''];

  const leftWordPart = leftWord[0];
  const rightWordPart = rightWord[0];

  const from = {
    ...position,
    ch: position.ch - leftWordPart.length,
  };
  const to = {
    ...position,
    ch: position.ch + rightWordPart.length,
  };

  return [from, to, leftWordPart, leftWordPart + rightWordPart];
}
