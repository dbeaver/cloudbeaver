/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
  HintFunction,
} from 'codemirror';
import { observable, computed, makeObservable, autorun } from 'mobx';
import type { IControlledCodeMirror } from 'react-codemirror2';

import type { ITab } from '@cloudbeaver/core-app';
import { ConnectionExecutionContextService } from '@cloudbeaver/core-connections';
import { IInitializableController, injectable } from '@cloudbeaver/core-di';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorService } from '../SqlEditorService';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService';

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
    if (!this.tab.handlerState.executionContext) {
      return true;
    }

    if (this.cursor && !this.getSubQuery()) {
      return true;
    }

    const context = this.connectionExecutionContextService.get(this.tab.handlerState.executionContext.baseId);

    return context?.executing || false;
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
      'Ctrl-Space': () => { this.showHint(false); }, // classic for windows, linux
      'Shift-Ctrl-Space': () => { this.showHint(false); },
      'Alt-Space': () => { this.showHint(false); }, // workaround for binded 'Ctrl-Space' by input switch in macOS
    },
  };

  readonly bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: this.options,
    onBeforeChange: this.handleQueryChange.bind(this),
    editorDidMount: this.handleEditorConfigure.bind(this),
  };

  private cursor: Position | null;
  private tab!: ITab<ISqlEditorTabState>;
  private editor?: Editor;

  constructor(
    private connectionExecutionContextService: ConnectionExecutionContextService,
    private sqlQueryService: SqlQueryService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private sqlEditorService: SqlEditorService,
    private sqlExecutionPlanService: SqlExecutionPlanService,
  ) {
    this.getHandleAutocomplete = this.getHandleAutocomplete.bind(this);
    this.getHandleAutocomplete = throttleAsync(this.getHandleAutocomplete, 1000 / 3);
    this.cursor = null;

    makeObservable<this, 'cursor'>(this, {
      dialect: computed,
      isActionsDisabled: computed,
      value: computed,
      cursor: observable,
    });
  }

  init(tab: ITab<ISqlEditorTabState>): void {
    this.tab = tab;
    autorun(() => {
      if (this.tab.handlerState.executionContext) {
        this.sqlDialectInfoService.loadSqlDialectInfo(this.tab.handlerState.executionContext.connectionId);
      }
    });
  }

  handleExecute = async (): Promise<void> => {
    if (this.isActionsDisabled) {
      return;
    }
    this.sqlQueryService.executeEditorQuery(
      this.tab.handlerState,
      this.getSubQuery(),
      false
    );
  };

  handleExecuteNewTab = async (): Promise<void> => {
    if (this.isActionsDisabled) {
      return;
    }
    this.sqlQueryService.executeEditorQuery(
      this.tab.handlerState,
      this.getSubQuery(),
      true
    );
  };

  handleExecutionPlan = async (): Promise<void> => {
    if (this.isActionsDisabled || !this.dialect?.supportsExplainExecutionPlan) {
      return;
    }
    this.sqlExecutionPlanService.executeExecutionPlan(
      this.tab.handlerState,
      this.getSubQuery(),
    );
  };

  private async showHint(activeSuggest: boolean) {
    if (!this.editor) {
      return;
    }

    if (
      this.editor.state.completionActive
      && this.editor.state.completionActive.options.completeSingle === !activeSuggest
    ) {
      this.editor.state.completionActive.update();
      return;
    }

    let hint: HintFunction | undefined = this.getHandleAutocomplete;

    if (!this.tab.handlerState.executionContext) {
      hint = undefined;
    }

    this.editor.showHint({
      completeSingle: !activeSuggest,
      updateOnCursorActivity: false,
      closeCharacters,
      hint,
    });
  }

  private getExecutingQuery(): string {
    if (!this.editor) {
      return this.tab.handlerState.query;
    }

    if (this.editor.somethingSelected()) {
      return this.editor.getSelection();
    }

    const delimiters = [];

    if (this.dialect?.scriptDelimiter) {
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

  private async getHandleAutocomplete(editor: Editor, options: ShowHintOptions): Promise<Hints | undefined> {
    if (!this.tab.handlerState.executionContext) {
      return;
    }

    const cursor = editor.getCursor('from');
    const cursorPosition = getAbsolutePosition(editor, cursor);
    const [from, to, word] = getWordRange(editor, cursor);

    let proposals = await this.sqlEditorService
      .getAutocomplete(
        this.tab.handlerState.executionContext.connectionId,
        this.tab.handlerState.executionContext.id,
        this.tab.handlerState.query,
        cursorPosition,
        undefined,
        !options.completeSingle
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

    return hints;
  }

  private handleEditorConfigure(editor: Editor) {
    this.editor = editor;

    let cursor: Position = editor.getCursor('from');
    this.cursor = { ...cursor };

    const ignoredChanges = ['+delete', 'undo', 'complete'];

    editor.on('changes', (cm, changes) => {
      if (!this.activeSuggest || editor.state.completionActive) {
        return;
      }

      const lastChange = changes[changes.length - 1];
      const origin = lastChange?.origin || '';
      const change = lastChange?.text[0] || '';

      if (
        ignoredChanges.includes(origin)
        || closeCharacters.test(change)) {
        return;
      }

      cursor = editor.getCursor('from');
      this.showHint(true);
    });

    editor.on('cursorActivity', () => {
      const newCursor = editor.getCursor('from');
      this.cursor = { ...newCursor };

      if (editor.state.completionActive) {
        if (newCursor.ch !== cursor?.ch || newCursor.line !== cursor.line) {
          cursor = newCursor;
          editor.state.completionActive.update();
        }
      }
      this.highlightActiveQuery();
    });

    this.highlightActiveQuery();
  }

  private highlightActiveQuery() {
    this.editor?.eachLine(line => {
      this.editor?.removeLineClass(line, 'background', 'active-query');
    });

    if (this.isActionsDisabled) {
      return;
    }

    const query = this.getSubQuery();
    const search = this.editor?.getSearchCursor(query, this.editor.getCursor('from'));

    if (search?.find(false) || search?.find(true)) {
      const from = search.from();
      const to = search.to();

      for (let line = from.line; line <= to.line; line++) {
        this.editor?.addLineClass(line, 'background', 'active-query');
      }
    }
  }

  private getSubQuery(): string {
    const query = this.getExecutingQuery();

    if (this.dialect?.scriptDelimiter && query.endsWith(this.dialect?.scriptDelimiter)) {
      return query.slice(0, query.length - this.dialect.scriptDelimiter.length);
    }

    return query.trim();
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
