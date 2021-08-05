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
  LineHandle,
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

  get isScriptEmpty(): boolean {
    return this.cursor !== null && !this.getSubQuery()?.query;
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
    lineWrapping: true,
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
      isScriptEmpty: computed,
      isDisabled: computed,
      value: computed,
      cursor: observable,
      executingScript: observable,
      readonly: computed,
    });
  }

  init(tab: ITab<ISqlEditorTabState>): void {
    this.tab = tab;
    this.parser.setScript(this.tab.handlerState.query);

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
    if (this.isDisabled || this.isScriptEmpty) {
      return;
    }

    const query = this.getSubQuery();

    if (!query) {
      return;
    }

    this.sqlQueryService.executeEditorQuery(
      this.tab.handlerState,
      query.query,
      false
    );
  };

  executeQueryNewTab = async (): Promise<void> => {
    if (this.isDisabled || this.isScriptEmpty) {
      return;
    }

    const query = this.getSubQuery();

    if (!query) {
      return;
    }

    this.sqlQueryService.executeEditorQuery(
      this.tab.handlerState,
      query.query,
      true
    );
  };

  showExecutionPlan = async (): Promise<void> => {
    if (this.isDisabled || this.isScriptEmpty || !this.dialect?.supportsExplainExecutionPlan) {
      return;
    }

    const query = this.getSubQuery();

    if (!query) {
      return;
    }

    await this.sqlExecutionPlanService.executeExecutionPlan(
      this.tab.handlerState,
      query.query,
    );
  };

  executeScript = async (): Promise<void> => {
    if (this.isDisabled) {
      return;
    }

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
          onQueryExecuted: (query, index) => {
            const subQuery = queries[index];
            this.highlightExecutingLine(subQuery.from, false);
          },
        }
      );
    } finally {
      this.executingScript = false;
    }
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

  private getExecutingQuery(): ISQLScriptSegment | undefined {
    if (!this.editor) {
      return {
        begin: 0,
        end: this.tab.handlerState.query.length,
        query: this.tab.handlerState.query,
        from: 0,
        to: this.parser.lineCount,
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
      this.highlightActiveLine(line, false);
    });

    if (!this.dialect) {
      return;
    }

    const query = this.getSubQuery();

    if (query) {
      this.highlightActiveLine(query.from, query.to, true);
    }
  }

  private highlightActiveLine(from: LineHandle, state: boolean): void
  private highlightActiveLine(from: number, to: number, state: boolean): void
  private highlightActiveLine(from: LineHandle | number, to: number | boolean, state?: boolean): void {
    if (typeof from === 'object') {
      if (state) {
        this.editor?.addLineClass(from, 'background', 'active-query');
      } else {
        this.editor?.removeLineClass(from, 'background', 'active-query');
      }
      return;
    }

    for (let line = from; line <= to; line++) {
      if (state) {
        this.editor?.addLineClass(line, 'background', 'active-query');
      } else {
        this.editor?.removeLineClass(line, 'background', 'active-query');
      }
    }
  }

  private highlightExecutingLine(line: number, state: boolean): void {
    if (state) {
      this.editor?.addLineClass(line, 'background', 'running-query');
    } else {
      this.editor?.removeLineClass(line, 'background', 'running-query');
    }
  }

  private getSubQuery(): ISQLScriptSegment | undefined {
    const query = this.getExecutingQuery();

    if (!query) {
      return undefined;
    }

    if (this.dialect?.scriptDelimiter && query.query.endsWith(this.dialect?.scriptDelimiter)) {
      query.query = query.query.slice(0, query.query.length - this.dialect.scriptDelimiter.length);
    }

    query.query = query.query.trim();

    return query;
  }

  private handleQueryChange(editor: Editor, data: EditorChange, query: string) {
    if (this.readonly) {
      (data as any).cancel();
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
