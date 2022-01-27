/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../plugin-codemirror/src/codemirror.meta.d.ts" />

import { Editor, EditorChange, EditorConfiguration, findModeByName, ModeSpec, EditorChangeCancellable, StringStream } from 'codemirror';
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

    if (this.dialect.quoteStrings.flat().includes('"')) {
      hooks['"'] = hookIdentifierDoublequote;
      // support['doubleQuote'] = true;
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

  setReadonly(readonly: boolean): void {
    this.readonlyState = readonly;
  }

  focus(): void {
    this.editor?.focus();
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