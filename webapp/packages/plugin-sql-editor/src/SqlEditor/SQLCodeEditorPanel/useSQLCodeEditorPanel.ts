/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
import type { IControlledCodeMirror } from 'react-codemirror2';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import type { SqlCompletionProposal } from '@cloudbeaver/core-sdk';

import type { ISQLEditorData } from '../ISQLEditorData';
import type { SQLCodeEditorController } from '../SQLCodeEditor/SQLCodeEditorController';

interface ISQLCodeEditorPanelData {
  proposalsWordFrom: Position | null;
  proposalsWord: string | null;
  proposalsMode: boolean | null;
  proposals: SqlCompletionProposal[] | null;
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

const closeCharacters = /[\s()[\]{};:>,=\\*]/;

export function useSQLCodeEditorPanel(
  data: ISQLEditorData,
  controller: SQLCodeEditorController | null
): ISQLCodeEditorPanelData {
  const editorPanelData = useObservableRef<ISQLCodeEditorPanelDataPrivate>(() => ({
    proposals: null,
    activeSuggest: true,
    options: {
      theme: 'material',
      lineNumbers: true,
      indentWithTabs: true,
      smartIndent: true,
      autofocus: true,
      showHint: true,
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
        'Ctrl-Space': () => { editorPanelData.showHint(false); }, // classic for windows, linux
        'Shift-Ctrl-Space': () => { editorPanelData.showHint(false); },
        'Alt-Space': () => { editorPanelData.showHint(false); }, // workaround for binded 'Ctrl-Space' by input switch in macOS
      },
    },
    bindings:  {
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

      // TODO: probably should be moved to SQLCodeEditorController
      editor.on('changes', (cm, changes) => {
        const nextCursor = editor.getCursor('from');

        if (this.data.parser.isEndsWithDelimiter(getAbsolutePosition(cm, nextCursor))) {
          this.data.updateParserScriptsThrottle();
        }

        this.controller?.resetLineStateHighlight();
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
          || closeCharacters.test(change)) {
          return;
        }

        cursor = nextCursor;
        this.showHint(true);
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

            cursor = from;

            if (closeCharacters.test(ch) || from.line !== cursor.line) {
              this.closeHint();
            } else {
              editor.state.completionActive.update();
            }
          }
        }
        this.highlightActiveQuery();
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

    async showHint(activeSuggest: boolean) {
      const editor = this.controller?.getEditor();

      if (!editor) {
        return;
      }

      if (
        editor.state.completionActive
        && editor.state.completionActive.options.completeSingle === !activeSuggest
      ) {
        editor.state.completionActive.update();
        return;
      }

      editor.showHint({
        completeSingle: !activeSuggest,
        updateOnCursorActivity: false,
        closeCharacters,
        hint: this.getHandleAutocomplete,
      });
    },


    async getHandleAutocomplete(
      editor: Editor,
      options: ShowHintOptions
    ): Promise<Hints | undefined> {
      const cursor = editor.getCursor('from');
      const [from, to, word] = getWordRange(editor, cursor);
      const cursorPosition = getAbsolutePosition(
        editor, word.length > 0
          ? { ...from, ch: from.ch + 1 }
          : from
      );

      const proposalWord = word.slice(0, 1);
      let proposals = editorPanelData.proposals;

      if (
        proposals === null
        || editorPanelData.proposalsWord !== proposalWord
        || editorPanelData.proposalsMode !== options.completeSingle
        || editorPanelData.proposalsWordFrom?.ch !== from.ch
        || editorPanelData.proposalsWordFrom.line !== from.line
        || !word.startsWith(editorPanelData.proposalsWord)
      ) {
        const proposalsMode = options.completeSingle ?? false;
        editorPanelData.proposalsMode = proposalsMode;
        editorPanelData.proposalsWord = proposalWord;
        editorPanelData.proposalsWordFrom = from;
        editorPanelData.proposals = [];

        proposals = await editorPanelData.data.getHintProposals(cursorPosition, !options.completeSingle);

        if (
          editorPanelData.proposalsWord === proposalWord
          && editorPanelData.proposalsWordFrom === from
          && editorPanelData.proposalsMode === proposalsMode
        ) {
          editorPanelData.proposals = proposals;

          if (editor.state.completionActive && proposals.length > 0) {
            editor.state.completionActive.update();
            return;
          }
        }
      }

      proposals = proposals.filter(
        ({ displayString }) => (
          word === '*'
          || (
            displayString.toLocaleLowerCase() !== word.toLocaleLowerCase()
            && displayString.toLocaleLowerCase().startsWith(word.toLocaleLowerCase())
          )
        )
      );

      const hints: Hints = {
        from,
        to,
        list: proposals.map(({ displayString, replacementString }) => ({
          text: replacementString,
          displayText: displayString,
        })),
      };

      // fix single completion
      if (proposals.length === 1 && options.completeSingle) {
        editor.showHint({
          completeSingle: true,
          updateOnCursorActivity: false,
          closeCharacters,
          hint: () => hints,
        });
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

  useExecutor({
    executor: data.onUpdate,
    handlers:[function updateHighlight() {
      editorPanelData.highlightActiveQuery();
    }],
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

function getWordRange(editor: Editor, position: Position): [Position, Position, string] {
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

  return [from, to, leftWordPart + rightWordPart];
}
