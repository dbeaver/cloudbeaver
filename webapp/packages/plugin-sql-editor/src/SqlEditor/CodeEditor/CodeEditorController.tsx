/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./codemirror.meta.d.ts" />

import { Editor, EditorConfiguration, findModeByName } from 'codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/mode/meta';
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
export class CodeEditorController {
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
      let keywords: Record<string, boolean> | undefined;
      let builtin: Record<string, boolean> | undefined;

      if (this.dialect?.dataTypes) {
        keywords = this.arrayToMap(this.dialect.dataTypes.map(v => v.toLowerCase()));
      }

      if (this.dialect?.functions || this.dialect?.reservedWords) {
        builtin = this.arrayToMap([
          ...(this.dialect.functions || []),
          ...(this.dialect.reservedWords || []),
        ].map(v => v.toLowerCase()));
      }

      if (this.bindings.options) {
        const name = this.dialect?.name && findModeByName(this.dialect.name)?.mime;

        if (this.dialect) {
          this.bindings.options.mode = {
            name: name || COMMON_EDITOR_CONFIGURATION.mode,
            keywords,
            builtin,
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

  private arrayToMap(array: string[]): { [key: string]: boolean } {
    return array.reduce((obj, value) => ({
      ...obj,
      [value]: true,
    }), {});
  }
}
