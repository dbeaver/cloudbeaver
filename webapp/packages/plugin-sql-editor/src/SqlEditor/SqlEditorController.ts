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
  HintFunction,
} from 'codemirror';
import { observable, computed, makeObservable, autorun, IReactionDisposer } from 'mobx';
import type { IControlledCodeMirror } from 'react-codemirror2';

import { ConnectionExecutionContextService } from '@cloudbeaver/core-connections';
import { IDestructibleController, IInitializableController, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { throttleAsync } from '@cloudbeaver/core-utils';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorService } from '../SqlEditorService';
import { ISQLScriptSegment, SQLParser } from '../SQLParser';
import { SqlExecutionPlanService } from '../SqlResultTabs/ExecutionPlan/SqlExecutionPlanService';
import { SqlQueryService } from '../SqlResultTabs/SqlQueryService';
import { SqlResultTabsService } from '../SqlResultTabs/SqlResultTabsService';

const closeCharacters = /[\s()[\]{};:>,=\\*]/;

@injectable()
export class SqlEditorController implements IInitializableController, IDestructibleController {
  get dialect(): SqlDialectInfo | undefined {
    if (!this.state.executionContext) {
      return undefined;
    }

    return this.sqlDialectInfoService.getDialectInfo(this.state.executionContext.connectionId);
  }

  get readonly(): boolean {
    return this.executingScript || this.readonlyState;
  }

  get isLineScriptEmpty(): boolean {
    return this.cursor !== null && !this.getSubQuery()?.query;
  }

  get isScriptEmpty(): boolean {
    return this.value === '' || this.parser.scripts.length === 0;
  }

  get isDisabled(): boolean {
    if (!this.state.executionContext) {
      return true;
    }

    const context = this.connectionExecutionContextService.get(this.state.executionContext.id);

    return context?.executing || false;
  }

  get value(): string {
    return this.state.query;
  }

  get activeSuggest(): boolean {
    return true;
  }

  private readonly parser: SQLParser;

  readonly options: EditorConfiguration = {
    theme: 'material',
    lineNumbers: true,
    indentWithTabs: true,
    smartIndent: true,
    autofocus: true,
    showHint: true,
    extraKeys: {
      // Execute sql script
      'Ctrl-Enter': () => { this.executeQuery(); },
      // Execute sql script in new tab
      'Ctrl-\\': () => { this.executeQueryNewTab(); },
      'Shift-Ctrl-Enter': () => { this.executeQueryNewTab(); },
      'Shift-Ctrl-E': () => { this.showExecutionPlan(); },
      'Shift-Ctrl-F': () => { this.formatScript(); },

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

  private readonlyState: boolean;
  private executingScript: boolean;
  private cursor: Position | null;
  private state!: ISqlEditorTabState;
  private editor?: Editor;
  private reactionDisposer: IReactionDisposer | null;

  constructor(
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly sqlQueryService: SqlQueryService,
    private readonly sqlDialectInfoService: SqlDialectInfoService,
    private readonly sqlEditorService: SqlEditorService,
    private readonly sqlExecutionPlanService: SqlExecutionPlanService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly commonDialogService: CommonDialogService
  ) {
    this.parser = new SQLParser();
    this.getHandleAutocomplete = throttleAsync(this.getHandleAutocomplete.bind(this), 1000 / 3);
    this.updateParserScriptsThrottle = throttleAsync(this.updateParserScriptsThrottle.bind(this), 1000 / 2);
    this.cursor = null;
    this.readonlyState = false;
    this.executingScript = false;
    this.reactionDisposer = null;

    this.parser.setCustomDelimiters(['\n\n']);

    makeObservable<this, 'cursor' | 'executingScript' | 'readonlyState'>(this, {
      dialect: computed,
      isLineScriptEmpty: computed,
      isDisabled: computed,
      value: computed,
      cursor: observable,
      readonlyState: observable,
      executingScript: observable,
      readonly: computed,
    });
  }

  init(state: ISqlEditorTabState): void {
    this.state = state;
    this.parser.setScript(this.value);

    this.reactionDisposer = autorun(() => {
      if (this.state.executionContext) {
        this.sqlDialectInfoService
          .loadSqlDialectInfo(this.state.executionContext.connectionId)
          .then(async dialect => {
            this.parser.setDialect(dialect || null);
            await this.updateParserScriptsThrottle();
          });
      }
    });
  }

  destruct(): void {
    this.reactionDisposer?.();
  }

  formatScript = async (): Promise<void> => {
    if (this.isDisabled || this.isScriptEmpty || !this.state.executionContext) {
      return;
    }

    const query = this.value;
    const script = this.getExecutingQuery(true);

    if (!script) {
      return;
    }

    this.beforeExecute();
    try {
      this.readonlyState = true;
      const formatted = await this.sqlDialectInfoService.formatScript(this.state.executionContext, script.query);

      this.setQuery(
        query.substring(0, script.begin)
        + formatted
        + query.substring(script.end)
      );
    } finally {
      this.readonlyState = false;
    }
  };

  executeQuery = async (): Promise<void> => {
    await this.executeQueryAction(
      this.getSubQuery(),
      query => this.sqlQueryService.executeEditorQuery(
        this.state,
        query.query,
        false
      )
    );
  };

  executeQueryNewTab = async (): Promise<void> => {
    await this.executeQueryAction(
      this.getSubQuery(),
      query => this.sqlQueryService.executeEditorQuery(
        this.state,
        query.query,
        true
      )
    );
  };

  showExecutionPlan = async (): Promise<void> => {
    if (!this.dialect?.supportsExplainExecutionPlan) {
      return;
    }

    await this.executeQueryAction(
      this.getSubQuery(),
      query => this.sqlExecutionPlanService.executeExecutionPlan(
        this.state,
        query.query,
      )
    );
  };

  executeScript = async (): Promise<void> => {
    if (this.isDisabled || this.isScriptEmpty) {
      return;
    }

    if (this.state.tabs.length) {
      const result = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'sql_editor_close_result_tabs_dialog_title',
        message: `Do you want to close ${this.state.tabs.length} tabs before executing script?`,
        confirmActionText: 'ui_yes',
        extraStatus: 'no',
      });

      if (result === DialogueStateResult.Resolved) {
        const state = await this.sqlResultTabsService.canCloseResultTabs(this.state);

        if (!state) {
          return;
        }

        this.sqlResultTabsService.removeResultTabs(this.state);
      } else if (result === DialogueStateResult.Rejected) {
        return;
      }
    }

    this.beforeExecute();
    try {
      this.executingScript = true;
      await this.updateParserScripts();
      const queries = this.parser.scripts;

      await this.sqlQueryService.executeQueries(
        this.state,
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

  setQuery(query: string): void {
    this.state.query = query;
    this.parser.setScript(query);
    this.updateParserScriptsThrottle();
    this.highlightActiveQuery();
  }

  private async updateParserScriptsThrottle() {
    await this.updateParserScripts();
  }

  private async updateParserScripts() {
    const connectionId = this.state.executionContext?.connectionId;
    const script = this.parser.actualScript;
    
    if (!connectionId) { 
      return;
    }

    const { queries } = await this.sqlEditorService
      .parseSQLScript(
        connectionId,
        script
      );
    
    if (this.parser.actualScript === script) {
      this.parser.setQueries(queries);
      this.highlightActiveQuery();
    }
  }

  private async executeQueryAction(
    query: ISQLScriptSegment | undefined,
    action: (query: ISQLScriptSegment) => Promise<void>
  ): Promise<void> {
    if (!query || this.isDisabled || this.isLineScriptEmpty) {
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

    if (!this.state.executionContext) {
      hint = undefined;
    }

    this.editor.showHint({
      completeSingle: !activeSuggest,
      updateOnCursorActivity: false,
      closeCharacters,
      hint,
    });
  }

  private getExecutingQuery(script: boolean): ISQLScriptSegment | undefined {
    if (this.editor?.somethingSelected()) {
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

    if (!this.editor || script) {
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

    const cursor = this.editor.getCursor();
    const position = getAbsolutePosition(this.editor, cursor);

    return this.parser.getQueryAtPos(position);
  }

  private async getHandleAutocomplete(editor: Editor, options: ShowHintOptions): Promise<Hints | undefined> {
    if (!this.state.executionContext) {
      return;
    }

    const cursor = editor.getCursor('from');
    const cursorPosition = getAbsolutePosition(editor, cursor);
    const [from, to, word] = getWordRange(editor, cursor);
    const query = this.state.query;

    let { proposals } = await this.sqlEditorService
      .getAutocomplete(
        this.state.executionContext.connectionId,
        this.state.executionContext.id,
        query,
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
      if (!this.activeSuggest) {
        return;
      }

      const lastChange = changes[changes.length - 1];
      const origin = lastChange.origin || '';
      const change = lastChange.text[0] || '';

      const nextCursor = editor.getCursor('from');

      if (nextCursor.line !== lastChange.from.line) {
        editor.closeHint();
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
      const newCursor = editor.getCursor('from');
      this.cursor = { ...newCursor };

      if (editor.state.completionActive) {
        if (newCursor.ch !== cursor.ch || newCursor.line !== cursor.line) {
          const ch = newCursor.ch > cursor.ch
            ? editor.getRange(cursor, newCursor)
            : editor.getRange(newCursor, cursor);

          cursor = newCursor;

          if (closeCharacters.test(ch) || newCursor.line !== cursor.line) {
            editor.closeHint();
          } else {
            editor.state.completionActive.update();
          }
        }
      }
      this.highlightActiveQuery();
    });

    this.highlightActiveQuery();
  }

  private highlightActiveQuery() {
    this.highlightSegment(true);

    if (this.editor?.somethingSelected()) {
      return;
    }

    const query = this.getSubQuery();

    if (query) {
      this.highlightSegment(query);
    }
  }

  private beforeExecute(): void {
    this.editor?.closeHint();
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
    const query = this.getExecutingQuery(false);

    if (!query) {
      return undefined;
    }

    // TODO: should be moved to SQLParser
    if (this.dialect?.scriptDelimiter && query.query.endsWith(this.dialect.scriptDelimiter)) {
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

    this.setQuery(query);
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
