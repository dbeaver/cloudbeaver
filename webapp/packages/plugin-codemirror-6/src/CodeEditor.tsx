/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import styled from 'reshadow';

import { useStyles } from '@cloudbeaver/core-blocks';
import { autocompletion } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { xml } from '@codemirror/lang-xml';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';

import type { ICodeEditorProps } from './ICodeEditorProps';
import { SqlEditorStyles } from './theme';
import { useAutoFormat } from './useAutoFormat';

const EXTENSIONS = [
  sql(), javascript(), xml(), json(), autocompletion(), EditorView.lineWrapping,
];

export const CodeEditor = observer<ICodeEditorProps>(function CodeEditor(props) {
  const container = useRef<HTMLDivElement | null>(null);

  const formatter = useAutoFormat(props.options?.mode);

  const { className, autoFormat } = props;

  let value = props.value;

  if (autoFormat) {
    value = formatter.format(value);
  }

  return styled(useStyles(SqlEditorStyles))(
    <code-editor ref={container} className={className}>
      <CodeMirror
        className='react-codemirror'
        value={value}
        height='100%'
        extensions={EXTENSIONS}
        basicSetup={
          {
            drawSelection: false,
          }
        }
      />
    </code-editor>
  );
});
