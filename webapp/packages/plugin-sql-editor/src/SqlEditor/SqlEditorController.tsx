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
import { ISQLScriptSegment, SQLParser } from '../SQLParser';
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

  get readonly(): boolean {
    return this.executingScript;
  }

  get isLineScriptEmpty(): boolean {
    return this.cursor !== null && !this.getSubQuery()?.query;
  }

  get isScriptEmpty(): boolean {
    return this.value === '' || this.parser.scripts.length === 0;
  }

  get isDisabled(): boolean {
    if (!this.tab.handlerState.executionContext) {
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

  private parser: SQLParser;

  readonly options: EditorConfiguration = {
    theme: 'material',
    lineNumbers: true,
    indentWithTabs: true,
    smartIndent: true,
    autofocus: true,
    lineWrapping: false,
    showHint: true,
    extraKeys: {
      // Execute sql script
      'Ctrl-Enter': () => { this.executeQuery(); },
      // Execute sql script in new tab
      'Ctrl-\\': () => { this.executeQueryNewTab(); },
      'Shift-Ctrl-Enter': () => { this.executeQueryNewTab(); },
      'Shift-Ctrl-E': () => { this.showExecutionPlan(); },

      'Alt-X': () => { this.executeScript(); },

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

  private executingScript: boolean;
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
    this.parser = new SQLParser();
    this.getHandleAutocomplete = this.getHandleAutocomplete.bind(this);
    this.getHandleAutocomplete = throttleAsync(this.getHandleAutocomplete, 1000 / 3);
    this.cursor = null;
    this.executingScript = false;

    this.parser.setCustomDelimiters(['\n\n']);

    makeObservable<this, 'cursor' | 'executingScript'>(this, {
      dialect: computed,
      isLineScriptEmpty: computed,
      isDisabled: computed,
      value: computed,
      cursor: observable,
      executingScript: observable,
      readonly: computed,
    });
  }

  init(tab: ITab<ISqlEditorTabState>): void {
    this.tab = tab;
    this.parser.setScript(this.value);

    autorun(() => {
      if (this.tab.handlerState.executionContext) {
        this.sqlDialectInfoService
          .loadSqlDialectInfo(this.tab.handlerState.executionContext.connectionId)
          .then(dialect => {
            this.parser.setDialect(dialect || null);
          });
      }
    });
  }

  executeQuery = async (): Promise<void> => {
    if (this.isDisabled || this.isLineScriptEmpty) {
      return;
    }

    await this.executeQueryAction(
      this.getSubQuery(),
      query => this.sqlQueryService.executeEditorQuery(
        this.tab.handlerState,
        query.query,
        false
      )
    );
  };

  executeQueryNewTab = async (): Promise<void> => {
    if (this.isDisabled || this.isLineScriptEmpty) {
      return;
    }

    await this.executeQueryAction(
      this.getSubQuery(),
      query => this.sqlQueryService.executeEditorQuery(
        this.tab.handlerState,
        query.query,
        true
      )
    );
  };

  showExecutionPlan = async (): Promise<void> => {
    if (this.isDisabled || this.isLineScriptEmpty || !this.dialect?.supportsExplainExecutionPlan) {
      return;
    }

    await this.executeQueryAction(
      this.getSubQuery(),
      query => this.sqlExecutionPlanService.executeExecutionPlan(
        this.tab.handlerState,
        query.query,
      )
    );
  };

  executeScript = async (): Promise<void> => {
    if (this.isDisabled || this.isScriptEmpty) {
      return;
    }

    this.beforeExecute();
    try {
      this.executingScript = true;
      const queries = this.parser.scripts;

      await this.sqlQueryService.executeQueries(
        this.tab.handlerState,
        queries.map(query => query.query),
        {
          onQueryExecutionStart: (query, index) => {
            const subQuery = queries[index];
            this.highlightExecutingLine(subQuery.from, true);
          },
          onQueryExecuted: (query, index, success) => {
            const subQuery = queries[index];
            this.highlightExecutingLine(subQuery.from, false);

            if (!success) {
              this.highlightExecutingErrorLine(subQuery.from, true);
            }
          },
        }
      );
    } finally {
      this.executingScript = false;
    }
  };

  private async executeQueryAction(
    query: ISQLScriptSegment | undefined,
    action: (query: ISQLScriptSegment) => Promise<void>
  ): Promise<void> {
    if (!query) {
      return;
    }

    this.beforeExecute();

    try {
      this.highlightExecutingLine(query.from, true);
      await action(query);
      this.highlightExecutingLine(query.from, false);
    } catch (exception) {
      this.highlightExecutingLine(query.from, false);
      this.highlightExecutingErrorLine(query.from, true);
      throw exception;
    }
  }

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

  private getExecutingQuery(): ISQLScriptSegment | undefined {
    if (!this.editor) {
      return {
        begin: 0,
        end: this.value.length,
        query: this.value,
        from: 0,
        to: this.parser.lineCount,
        fromPosition: 0,
        toPosition: this.parser.getScriptLineAtPos(this.value.length)?.end || 0,
      };
    }

    if (this.editor.somethingSelected()) {
      const selection = this.editor.getSelection();
      const from = this.editor.getCursor('from');
      const to = this.editor.getCursor('to');

      const begin = getAbsolutePosition(this.editor, from);
      const end = getAbsolutePosition(this.editor, to);

      return {
        query: selection,
        begin,
        end,
        from: from.line,
        to: to.line,
        fromPosition: from.ch,
        toPosition: to.ch,
      };
    }

    const cursor = this.editor.getCursor();
    const position = getAbsolutePosition(this.editor, cursor);

    return this.parser.getQueryAtPos(position);
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

    // TODO: probably should be moved to SQLCodeEditorController
    editor.on('changes', (cm, changes) => {
      this.resetLineStateHighlight();
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

    // TODO: probably should be moved to SQLCodeEditorController
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
    this.highlightSegment(true);

    const query = this.getSubQuery();

    if (query) {
      this.highlightSegment(query);
    }
  }

  private beforeExecute(): void {
    this.resetLineStateHighlight();
  }

  private resetLineStateHighlight(): void {
    this.editor?.eachLine(line => {
      const lineNumber = this.editor?.getLineNumber(line);

      if (lineNumber !== null && lineNumber !== undefined) {
        this.highlightExecutingLine(lineNumber, false);
        this.highlightExecutingErrorLine(lineNumber, false);
      }
    });
  }

  private highlightSegment(clear: true): void
  private highlightSegment(segment: ISQLScriptSegment): void
  private highlightSegment(segment: ISQLScriptSegment | true): void {
    if (segment === true) {
      const marks = this.editor?.getAllMarks();

      if (marks) {
        for (const mark of marks) {
          if (mark.className === 'active-query') {
            mark.clear();
          }
        }
      }
      return;
    }

    this.editor?.markText(
      { line: segment.from, ch: segment.fromPosition },
      { line: segment.to, ch: segment.toPosition },
      {
        className: 'active-query',
      }
    );
  }

  private highlightExecutingLine(line: number, state: boolean): void {
    if (state) {
      this.editor?.addLineClass(line, 'background', 'running-query');
    } else {
      this.editor?.removeLineClass(line, 'background', 'running-query');
    }
  }

  private highlightExecutingErrorLine(line: number, state: boolean): void {
    if (state) {
      this.editor?.addLineClass(line, 'background', 'running-query-error');
    } else {
      this.editor?.removeLineClass(line, 'background', 'running-query-error');
    }
  }

  private getSubQuery(): ISQLScriptSegment | undefined {
    const query = this.getExecutingQuery();

    if (!query) {
      return undefined;
    }

    // TODO: should be moved to SQLParser
    if (this.dialect?.scriptDelimiter && query.query.endsWith(this.dialect?.scriptDelimiter)) {
      query.query = query.query.slice(0, query.query.length - this.dialect.scriptDelimiter.length);
    }

    query.query = query.query.trim();

    return query;
  }

  private handleQueryChange(editor: Editor, data: EditorChange, query: string) {
    if (this.readonly) {
      (data as any).cancel(); // seems it doesn't works, after disabling read-only mode, typings appears
      return;
    }
    this.tab.handlerState.query = query;
    this.parser.setScript(query);
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
