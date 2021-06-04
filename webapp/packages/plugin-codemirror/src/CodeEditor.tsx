/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Controlled as CodeMirror } from 'react-codemirror2';
import styled, { use } from 'reshadow';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/htmlembedded/htmlembedded';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/meta';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';

import { useStyles } from '@cloudbeaver/core-theming';

import type { ICodeEditorProps } from './ICodeEditorProps';
import { SqlEditorStyles } from './theme';

export const CodeEditor = observer<ICodeEditorProps>(function CodeEditor(props) {
  return styled(useStyles(SqlEditorStyles))(
    <code-editor {...use({ readonly: props.readonly })} className={props.className}>
      <CodeMirror {...props} />
    </code-editor>
  );
});
