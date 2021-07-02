/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  EditorConfiguration,
  Editor,
  EditorChange,
  Position,
  Hints,
  HintFunction, on as CodemirrorOn,
  off as CodemirrorOff,
  Hint
} from 'codemirror';
import { computed, makeObservable } from 'mobx';
import type { IControlledCodeMirror } from 'react-codemirror2';

import type { ITab } from '@cloudbeaver/core-app';
import { IInitializableController, injectable } from '@cloudbeaver/core-di';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorService } from '../SqlEditorService';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService';
import { SqlResultTabsService } from '../SqlResultTabs/SqlResultTabsService';

const closeCharacters = /[\s()[\]{};:>,=]/;

@injectable()
export class SqlEditorController implements IInitializableController {
  get dialect(): SqlDialectInfo | undefined {
    if (!this.tab.handlerState.executionContext) {
      return undefined;
    }

    return this.sqlDialectInfoService.getDialectInfo(this.tab.handlerState.executionContext.connectionId);
  }

  get isActionsDisabled(): boolean {
    return this.sqlResultTabsService.getTabExecutionContext(this.tab.id).isExecuting;
  }

  get value(): string {
    return this.tab.handlerState.query;
  }

  get activeSuggest(): boolean {
    return true;
  }

  readonly options: EditorConfiguration = {
    theme: 'material',
    lineNumbers: true,
    indentWithTabs: true,
    smartIndent: true,
    autofocus: true,
    lineWrapping: true,
    showHint: true,
    extraKeys: {
      // Execute sql script
      'Ctrl-Enter': () => { this.handleExecute(); },
      // Execute sql script in new tab
      'Ctrl-\\': () => { this.handleExecuteNewTab(); },
      'Shift-Ctrl-Enter': () => { this.handleExecuteNewTab(); },
      'Shift-Ctrl-E': () => { this.handleExecutionPlan(); },

      // Autocomplete
      'Ctrl-Space': () => { this.showHint(); }, // classic for windows, linux
      'Shift-Ctrl-Space': () => { this.showHint(); },
      'Alt-Space': () => { this.showHint(); }, // workaround for binded 'Ctrl-Space' by input switch in macOS
    },
  };

  readonly bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: this.options,
    onBeforeChange: this.handleQueryChange.bind(this),
    editorDidMount: this.handleEditorConfigure.bind(this),
  };

  private tab!: ITab<ISqlEditorTabState>;
  private editor?: Editor;
  private lastHints: Hints | null;
  private lastCompletion: string | null;

  constructor(
    private sqlResultTabsService: SqlResultTabsService,
    private sqlQueryService: SqlQueryService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private sqlEditorService: SqlEditorService,
    private sqlExecutionPlanService: SqlExecutionPlanService,
  ) {
    this.lastHints = null;
    this.lastCompletion = null;
    this.setLastCompletion = this.setLastCompletion.bind(this);
    this.getHandleAutocomplete = this.getHandleAutocomplete.bind(this);
    this.getHandleAutocomplete = throttleAsync(this.getHandleAutocomplete, 1000 / 30);
    makeObservable(this, {
      dialect: computed,
      isActionsDisabled: computed,
      value: computed,
    });
  }

  init(tab: ITab<ISqlEditorTabState>): void {
    this.tab = tab;
    this.loadDialect();
  }

  handleExecute = async (): Promise<void> => {
    if (this.isActionsDisabled) {
      return;
    }
    this.sqlQueryService.executeEditorQuery(
      this.sqlResultTabsService.getTabExecutionContext(this.tab.id),
      this.tab.handlerState,
      await this.getExecutingQuery(),
      false
    );
  };

  handleExecuteNewTab = async (): Promise<void> => {
    if (this.isActionsDisabled) {
      return;
    }
    this.sqlQueryService.executeEditorQuery(
      this.sqlResultTabsService.getTabExecutionContext(this.tab.id),
      this.tab.handlerState,
      await this.getExecutingQuery(),
      true
    );
  };

  handleExecutionPlan = async (): Promise<void> => {
    if (this.isActionsDisabled || !this.dialect?.supportsExplainExecutionPlan) {
      return;
    }
    this.sqlExecutionPlanService.executeExecutionPlan(
      this.sqlResultTabsService.getTabExecutionContext(this.tab.id),
      this.tab.handlerState,
      await this.getExecutingQuery(),
    );
  };

  private async showHint() {
    if (!this.editor) {
      return;
    }

    if (this.editor.state.completionActive) {
      (this.editor.state.completionActive).update();
      return;
    }

    let hint: HintFunction | undefined = this.getHandleAutocomplete;

    if (!this.tab.handlerState.executionContext) {
      hint = undefined;
    }

    this.editor.showHint({
      completeSingle: !this.activeSuggest,
      updateOnCursorActivity: !this.activeSuggest,
      closeCharacters,
      hint,
    });
  }

  private async loadDialect(): Promise<SqlDialectInfo | undefined> {
    if (!this.tab.handlerState.executionContext) {
      return undefined;
    }

    return await this.sqlDialectInfoService.loadSqlDialectInfo(this.tab.handlerState.executionContext.connectionId);
  }

  private async getExecutingQuery(): Promise<string> {
    if (!this.editor) {
      return this.tab.handlerState.query;
    }

    if (this.editor.somethingSelected()) {
      return this.editor.getSelection();
    }

    const delimiters = [];
    const dialect = await this.loadDialect();

    if (dialect?.scriptDelimiter) {
      delimiters.push(dialect.scriptDelimiter);
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

  private async getHandleAutocomplete(editor: Editor): Promise<Hints | undefined> {
    if (!this.tab.handlerState.executionContext) {
      return;
    }

    const cursor = editor.getCursor('from');
    const cursorPosition = getAbsolutePosition(editor, cursor);
    const [from, to, word] = getWordRange(editor, cursor);

    let proposals = await this.sqlEditorService
      .getAutocomplete(
        this.tab.handlerState.executionContext.connectionId,
        this.tab.handlerState.executionContext.contextId,
        this.tab.handlerState.query,
        cursorPosition,
        undefined,
        this.activeSuggest
      );

    proposals = proposals?.filter(
      ({ displayString }) => displayString.toLocaleLowerCase() !== word.toLocaleLowerCase()
    );

    if (!proposals || proposals.length === 0) {
      return;
    }

    const hints: Hints = {
      from,
      to,
      list: proposals.map(({ displayString, replacementString }) => ({
        text: replacementString,
        displayText: displayString,
      })),
    };

    if (this.lastHints) {
      CodemirrorOff(this.lastHints, 'pick', this.setLastCompletion);
    }

    this.lastHints = hints;
    CodemirrorOn(hints, 'pick', this.setLastCompletion);

    return hints;
  }

  private setLastCompletion(hint: string | Hint): void {
    if (typeof hint === 'object') {
      hint = hint.text;
    }
    this.lastCompletion = hint;
  }

  private handleEditorConfigure(editor: Editor) {
    this.editor = editor;

    editor.on('cursorActivity', () => {
      if (this.activeSuggest) {
        const cursor = editor.getCursor('from');

        if (cursor.ch) {
          const line = editor.getLine(cursor.line);
          const lastChar = line.charAt(cursor.ch - 1);

          if (closeCharacters.test(lastChar) || (this.lastCompletion && line.endsWith(this.lastCompletion))) {
            this.lastCompletion = null;
            editor.closeHint();
            return;
          }
        } else {
          editor.closeHint();
          return;
        }

        this.showHint();
      }
    });
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
    this.tab.handlerState.query = query;
  }
}

function getAbsolutePosition(editor: Editor, position: Position) {
  return editor.getRange({ line: 0, ch: 0 }, position).length;
}

function getWordRange(editor: Editor, position: Position): [Position, Position, string] {
  const line = editor.getLine(position.line);

  const leftSubstr = line.substr(0, position.ch);
  const rightSubstr = line.substr(position.ch);
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
