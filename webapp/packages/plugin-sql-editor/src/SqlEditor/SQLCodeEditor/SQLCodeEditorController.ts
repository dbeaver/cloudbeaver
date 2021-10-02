/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../../plugin-codemirror/src/codemirror.meta.d.ts" />

import { Editor, EditorConfiguration, findModeByName, ModeSpec, ModeSpecOptions } from 'codemirror';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/search/searchcursor';
import { observable, makeObservable, computed } from 'mobx';
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
};

@injectable()
export class SQLCodeEditorController {
  private dialect?: SqlDialectInfo;
  private editor?: Editor;

  get mode(): string | ModeSpec<ModeSpecOptions> | undefined {
    const name = (
      this.dialect?.name
      && this.editor
      && findModeByName(this.dialect.name)?.mime
    ) || COMMON_EDITOR_CONFIGURATION.mode as string;

    if (!this.dialect) {
      return name;
    }

    let keywords: string[] | undefined;
    let builtin: string[] | undefined;

    if (this.dialect?.dataTypes) {
      keywords = this.dialect.dataTypes.map(v => v.toLowerCase());
    }

    if (this.dialect?.functions || this.dialect?.reservedWords) {
      builtin = [
        ...(this.dialect.functions || []),
        ...(this.dialect.reservedWords || []),
      ].map(v => v.toUpperCase());
    }

    return {
      name,
      extra_keywords: keywords,
      extra_builtins: builtin,
    };
  }

  bindings: Omit<IControlledCodeMirror, 'value'> = {
    options: { ...COMMON_EDITOR_CONFIGURATION },
    editorDidMount: this.handleConfigure.bind(this),
    onBeforeChange: () => {},
  };

  constructor() {
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
    if (bindings?.onBeforeChange) {
      this.bindings.onBeforeChange = bindings.onBeforeChange;
    }
  }

  setDialect(dialect?: SqlDialectInfo): void {
    if (this.dialect === dialect) {
      return;
    }

    this.dialect = dialect;
  }

  focus(): void {
    this.editor?.focus();
  }

  private handleConfigure(editor: Editor) {
    this.editor = editor;
  }
}
