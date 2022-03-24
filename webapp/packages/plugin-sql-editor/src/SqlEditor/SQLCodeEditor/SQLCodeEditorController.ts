/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../plugin-codemirror/src/codemirror.meta.d.ts" />

import { Position, Editor, EditorChange, EditorConfiguration, findModeByName, ModeSpec, EditorChangeCancellable, StringStream } from 'codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/search/searchcursor';
import { observable, makeObservable, computed } from 'mobx';
import type { IControlledCodeMirror } from 'react-codemirror2';

import { injectable } from '@cloudbeaver/core-di';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

interface ISqlModeOptions {
  keywords?: Record<string, boolean>;
  builtin?: Record<string, boolean>;
  support?: Record<string, boolean>;
  hooks?: Record<string, any>;
}

const COMMON_EDITOR_CONFIGURATION: EditorConfiguration = {
  theme: 'material',
  mode: 'text/x-sql',
  lineNumbers: true,
  indentWithTabs: true,
  smartIndent: true,
  autofocus: true,
};

@injectable()
export class SQLCodeEditorController {
  private dialect?: SqlDialectInfo;
  private editor?: Editor;

  get mode(): string | ModeSpec<ISqlModeOptions> | undefined {
    const name = (
      this.dialect?.name
      && this.editor
      && findModeByName(this.dialect.name)?.mime
    ) || COMMON_EDITOR_CONFIGURATION.mode as string;

    if (!this.dialect) {
      return name;
    }

    const support: Record<string, boolean> = {};
    const keywords: Record<string, boolean> = {};
    const builtin: Record<string, boolean> = {};
    const hooks: Record<string, any> = {};

    for (const key of this.dialect.dataTypes) {
      builtin[key.toLowerCase()] = true;
    }

    for (const key of this.dialect.functions) {
      builtin[key.toLowerCase()] = true;
    }

    for (const key of this.dialect.reservedWords) {
      keywords[key.toLowerCase()] = true;
    }

    const quoteStrings = this.dialect.quoteStrings.flat();

    if (quoteStrings.includes('"')) {
      hooks['"'] = hookIdentifierDoublequote;
      // support['doubleQuote'] = true;
    }

    if (quoteStrings.includes('`')) {
      hooks['`'] =   hookIdentifier;
    }

    if (this.dialect.singleLineComments.includes('#')) {
      support['commentHash'] = true;
      support['commentSpaceRequired'] = true;
    }

    support['ODBCdotTable'] = true;

    return {
      name,
      keywords,
      builtin,
      support,
      hooks,
    };
  }

  bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: { ...COMMON_EDITOR_CONFIGURATION },
    editorDidMount: this.handleConfigure.bind(this),
    onBeforeChange: () => {},
  };

  private readonlyState: boolean;

  constructor() {
    this.readonlyState = false;
    makeObservable<this, 'dialect' | 'editor'>(this, {
      dialect: observable.ref,
      editor: observable.ref,
      bindings: observable,
      mode: computed,
    });
  }

  setBindings(bindings?: Partial<IControlledCodeMirror>): void {
    this.bindings.options = {
      ...COMMON_EDITOR_CONFIGURATION,
      ...(bindings?.options || {}),
    };
    if (bindings?.editorDidMount) {
      this.bindings.editorDidMount = (editor: Editor, value: string, cb: () => void) => {
        this.handleConfigure(editor);
        bindings.editorDidMount!(editor, value, cb);
      };
    }
    this.bindings.onBeforeChange = (editor: Editor, data: EditorChange, value: string) => {
      if (this.readonlyState && isCancellable(data)) {
        data.cancel();
      }
      bindings?.onBeforeChange?.(editor, data, value);
    };
  }

  setDialect(dialect?: SqlDialectInfo): void {
    if (this.dialect === dialect) {
      return;
    }

    this.dialect = dialect;
  }

  getEditor(): Editor | undefined {
    return this.editor;
  }

  setReadonly(readonly: boolean): void {
    this.readonlyState = readonly;
  }

  focus(): void {
    this.editor?.focus();
  }

  resetLineStateHighlight(): void {
    this.editor?.eachLine(line => {
      const lineNumber = this.editor?.getLineNumber(line);

      if (lineNumber !== null && lineNumber !== undefined) {
        this.highlightExecutingLine(lineNumber, false);
        this.highlightExecutingErrorLine(lineNumber, false);
      }
    });
  }

  highlightSegment(clear: true): void;
  highlightSegment(from: Position, to: Position): void;
  highlightSegment(from: Position | true, to?: Position): void {
    if (from === true) {
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
      from,
      to!,
      {
        className: 'active-query',
      }
    );
  }

  highlightExecutingLine(line: number, state: boolean): void {
    if (state) {
      this.editor?.addLineClass(line, 'background', 'running-query');
    } else {
      this.editor?.removeLineClass(line, 'background', 'running-query');
    }
  }

  highlightExecutingErrorLine(line: number, state: boolean): void {
    if (state) {
      this.editor?.addLineClass(line, 'background', 'running-query-error');
    } else {
      this.editor?.removeLineClass(line, 'background', 'running-query-error');
    }
  }

  private handleConfigure(editor: Editor) {
    this.editor = editor;
  }
}

function isCancellable(obj: EditorChange): obj is EditorChangeCancellable {
  return (
    'cancel' in obj
    && 'update' in obj
    && typeof (obj as EditorChangeCancellable)['cancel'] === 'function'
    && typeof (obj as EditorChangeCancellable)['update'] === 'function'
  );
}


// "identifier"
function hookIdentifierDoublequote(stream: StringStream) {
  // Standard SQL /SQLite identifiers
  // ref: http://web.archive.org/web/20160813185132/http://savage.net.au/SQL/sql-99.bnf.html#delimited%20identifier
  // ref: http://sqlite.org/lang_keywords.html
  let ch;
  while ((ch = stream.next()) != null) {
    if (ch == '"' && !stream.eat('"')) {return 'variable-2';}
  }
  stream.backUp(stream.current().length - 1);
  return stream.eatWhile(/\w/) ? 'variable-2' : null;
}

// `identifier`
function hookIdentifier(stream: StringStream) {
  // MySQL/MariaDB identifiers
  // ref: http://dev.mysql.com/doc/refman/5.6/en/identifier-qualifiers.html
  let ch;
  while ((ch = stream.next()) != null) {
    if (ch == '`' && !stream.eat('`')) {return 'variable-2';}
  }
  stream.backUp(stream.current().length - 1);
  return stream.eatWhile(/\w/) ? 'variable-2' : null;
}