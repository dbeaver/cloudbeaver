/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import CodeMirror, {
  EditorConfiguration, Editor, EditorChange, Position, AsyncHintFunction,
} from 'codemirror';
import { computed } from 'mobx';
import { IControlledCodeMirror } from 'react-codemirror2';

import { Tab } from '@dbeaver/core/app';
import { IInitializableController, injectable } from '@dbeaver/core/di';
import { SqlDialectInfo } from '@dbeaver/core/sdk';

import { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorManagerService } from '../SqlEditorManagerService';
import { sqlEditorTabHandlerKey } from '../sqlEditorTabHandlerKey';
import { SqlEditorService } from './SqlEditorService';

// allows to bypass rollup-commonjs error " 'showHint' is not exported by codemirror.js "
const showHint = CodeMirror.showHint;

@injectable()
export class SqlEditorController implements IInitializableController {

  @computed get dialect(): SqlDialectInfo | undefined {
    const state = this.tab.getHandlerState<ISqlEditorTabState>(sqlEditorTabHandlerKey);
    if (!state) {
      return;
    }
    return this.sqlDialectInfoService.getDialectInfo(state.connectionId);
  }

  @computed get isActionsDisabled(): boolean {
    const state = this.tab.getHandlerState<ISqlEditorTabState>(sqlEditorTabHandlerKey)!;
    return state.sqlExecutionState.isSqlExecuting;
  }

  handleExecute = () => {
    this.sqlEditorManager.executeEditorQuery(this.editorId, this.getExecutingQuery());
  }

  handleExecuteNewTab = () => {
    this.sqlEditorManager.executeEditorQuery(this.editorId, this.getExecutingQuery(), true);
  }

  readonly options: EditorConfiguration = {
    theme: 'material',
    mode: 'text/x-sql',
    lineNumbers: true,
    indentWithTabs: true,
    smartIndent: true,
    // matchBrackets: true, unknown property?
    autofocus: true,
    lineWrapping: true,
    showHint: true,
    hintOptions: {
      completeSingle: true,
      hint: this.getHandleAutocomplete(),
    },
    extraKeys: {
      // Execute sql script
      'Ctrl-Enter': this.handleExecute,
      // Execute sql script in new tab
      'Ctrl-\\': this.handleExecuteNewTab,
      'Shift-Ctrl-Enter': this.handleExecuteNewTab,

      // Autocomplete
      'Ctrl-Space': showHint, // classic for windows, linux
      'Shift-Ctrl-Space': showHint,
      'Alt-Space': showHint, // workaround for binded 'Ctrl-Space' by input switch in macOS
    },
  };

  readonly bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: this.options,
    onBeforeChange: this.handleQueryChange.bind(this),
    editorDidMount: this.handleEditorConfigure.bind(this),
  }

  @computed get value() {
    const state = this.tab.getHandlerState<ISqlEditorTabState>(sqlEditorTabHandlerKey)!;
    return state.query;
  }

  private tab!: Tab;
  private editorId!: string;
  private editor?: Editor;

  constructor(private sqlEditorManager: SqlEditorManagerService,
              private sqlDialectInfoService: SqlDialectInfoService,
              private sqlEditorService: SqlEditorService) {
  }

  init(tab: Tab) {
    this.tab = tab;
    this.editorId = tab.nodeId;
  }

  private getExecutingQuery(): string {
    if (!this.editor) {
      const state = this.tab.getHandlerState<ISqlEditorTabState>(sqlEditorTabHandlerKey)!;
      return state.query;
    }

    if (this.editor.somethingSelected()) {
      return this.editor.getSelection();
    }

    const delimiters = [];
    if (this.dialect && this.dialect.scriptDelimiter) {
      delimiters.push(this.dialect.scriptDelimiter);
    }

    const cursor = this.editor.getCursor();
    const lines = this.editor.lineCount();
    let begin = cursor.line > 0
      ? this.findQueryBegin(this.editor, delimiters, cursor.line)
      : 0;
    const end = this.findQueryEnd(this.editor, delimiters, cursor.line, lines);

    if (end < begin) {
      begin = end > 0
        ? this.findQueryBegin(this.editor, delimiters, end)
        : 0;
    }

    return this.editor.getRange({ line: begin, ch: 0 }, { line: end, ch: this.editor.getLine(end).length });
  }

  private getHandleAutocomplete(): AsyncHintFunction {
    const handleAutocomplete: AsyncHintFunction = (editor, callback) => {
      const cursor = editor.getCursor('from');
      const cursorPosition = getAbsolutePosition(editor, cursor);
      const [from, to] = getWordRange(editor, cursor);

      this.sqlEditorService
        .getAutocomplete(this.editorId, cursorPosition)
        .then((proposals) => {
          if (!proposals) {
            return;
          }
          callback({
            from,
            to,
            list: proposals.map(({ displayString }) => displayString || ''),
          });
        });
    };
    // tell CodeMirror that it is async func
    handleAutocomplete.async = true;

    return handleAutocomplete;
  }

  private handleEditorConfigure(editor: Editor) {
    this.editor = editor;
  }

  private findQueryBegin(editor: Editor, delimiters: string[], position: number) {
    for (let line = position - 1; line >= 0; line--) {
      const trimmed = editor.getLine(line).trim();
      if (this.isLineEndedWithDelimiter(delimiters, trimmed)) {
        return line + 1;
      }
    }
    return 0;
  }

  private findQueryEnd(editor: Editor, delimiters: string[], position: number, count: number) {
    for (let line = position; line < count; line++) {
      const trimmed = editor.getLine(line).trim();
      if (this.isLineEndedWithDelimiter(delimiters, trimmed)) {
        if (trimmed.length === 0 && line === position && line > 0) {
          return line - 1;
        }
        return line;
      }
    }
    return count - 1;
  }

  private isLineEndedWithDelimiter(delimiters: string[], line: string) {
    for (const delimiter of delimiters) {
      if (line.length === 0 || (line.length - delimiter.length >= 0
        && line.substr(line.length - delimiter.length, delimiter.length) === delimiter)) {
        return true;
      }
    }
    return false;
  }

  private handleQueryChange(editor: Editor, data: EditorChange, query: string) {
    const state = this.tab.getHandlerState<ISqlEditorTabState>(sqlEditorTabHandlerKey)!;
    state.query = query;
  }
}

function getAbsolutePosition(editor: Editor, position: Position) {
  return editor.getRange({ line: 0, ch: 0 }, position).length;
}

function getWordRange(editor: Editor, position: Position) {
  const line = editor.getLine(position.line);

  const leftSubstr = line.substr(0, position.ch);
  const rightSubstr = line.substr(position.ch);
  const leftWord = /\w+$/.exec(leftSubstr) || [''];
  const rightWord = /^\w+/.exec(rightSubstr) || [''];

  const from = {
    ...position,
    ch: position.ch - leftWord[0].length,
  };
  const to = {
    ...position,
    ch: position.ch + rightWord[0].length,
  };

  return [from, to];
}
