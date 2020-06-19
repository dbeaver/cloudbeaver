/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Editor, EditorConfiguration, StringStream } from 'codemirror';
import { IControlledCodeMirror } from 'react-codemirror2';

import { injectable } from '@cloudbeaver/core-di';
import { SqlDialectInfo } from '@cloudbeaver/core-sdk';

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
    options: COMMON_EDITOR_CONFIGURATION,
    editorDidMount: this.handleConfigure.bind(this),
    onBeforeChange: () => {},
  };

  init(bindings?: Partial<IControlledCodeMirror>) {
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

  setDialect(dialect?: SqlDialectInfo) {
    this.dialect = dialect;
  }

  private handleConfigure(editor: Editor) {
    this.editor = editor;
    this.editor.addOverlay({
      token: this.overlayModeToken.bind(this),
    });
  }

  private overlayModeToken(stream: StringStream) {
    stream.next();
    if (!this.dialect) {
      return null;
    }
    stream.eatWhile(/^[_\w\d]/);
    const word = stream.current().toUpperCase().trim();
    if (this.dialect.dataTypes?.includes(word)) {
      return 'type';
    }
    if (this.dialect.functions?.includes(word)) {
      return 'builtin';
    }
    if (this.dialect.reservedWords?.includes(word)) {
      return 'keyword';
    }
    return null;
  }
}
