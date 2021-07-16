/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../plugin-codemirror/src/codemirror.meta.d.ts" />

import { Editor, EditorConfiguration, findModeByName } from 'codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/search/searchcursor';
import { observable, makeObservable } from 'mobx';
import type { IControlledCodeMirror } from 'react-codemirror2';

import { injectable } from '@cloudbeaver/core-di';
import type { SqlDialectInfo } from '@cloudbeaver/core-sdk';

const COMMON_EDITOR_CONFIGURATION: EditorConfiguration = {
  theme: 'material',
  mode: 'text/x-sql',
  lineNumbers: true,
  indentWithTabs: true,
  smartIndent: true,
  autofocus: true,
  lineWrapping: true,
};

@injectable()
export class SQLCodeEditorController {
  private dialect?: SqlDialectInfo;
  private editor?: Editor;

  bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: { ...COMMON_EDITOR_CONFIGURATION },
    editorDidMount: this.handleConfigure.bind(this),
    onBeforeChange: () => {},
  };

  constructor() {
    makeObservable(this, {
      bindings: observable,
    });
  }

  init(bindings?: Partial<IControlledCodeMirror>): void {
    this.setBindings(bindings);
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
    if (bindings?.onBeforeChange) {
      this.bindings.onBeforeChange = bindings.onBeforeChange;
    }
  }

  setDialect(dialect?: SqlDialectInfo): void {
    if (this.dialect === dialect) {
      return;
    }

    this.dialect = dialect;

    if (this.editor) {
      let keywords: string[] | undefined;
      let builtin: string[] | undefined;

      if (this.dialect?.dataTypes) {
        keywords = this.dialect.dataTypes.map(v => v.toLowerCase());
      }

      if (this.dialect?.functions || this.dialect?.reservedWords) {
        builtin = [
          ...(this.dialect.functions || []),
          ...(this.dialect.reservedWords || []),
        ].map(v => v.toLowerCase());
      }

      if (this.bindings.options) {
        const name = this.dialect?.name && findModeByName(this.dialect.name)?.mime;

        if (this.dialect) {
          this.bindings.options.mode = {
            name: name || COMMON_EDITOR_CONFIGURATION.mode as string,
            extra_keywords: keywords,
            extra_builtins: builtin,
          };
        } else {
          this.bindings.options.mode = name || COMMON_EDITOR_CONFIGURATION.mode;
        }
      }
    }
  }

  focus(): void {
    this.editor?.focus();
  }

  private handleConfigure(editor: Editor) {
    this.editor = editor;
  }
}
