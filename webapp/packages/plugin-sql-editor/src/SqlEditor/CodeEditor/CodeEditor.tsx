/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { Controlled as CodeMirror, IControlledCodeMirror } from 'react-codemirror2';
import styled, { use } from 'reshadow';

import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/sql/sql';
import 'codemirror/addon/hint/sql-hint';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/hint/show-hint.css';

import { useController } from '@cloudbeaver/core-di';
import { SqlDialectInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { SqlEditorStyles } from '../theme';
import { CodeEditorController } from './CodeEditorController';

export type CodeEditorProps = {
  bindings?: Omit<IControlledCodeMirror, 'value'>;
  value?: string;
  dialect?: SqlDialectInfo;
  readonly?: boolean;
  className?: string;
};

export const CodeEditor = observer(function CodeEditor(props: CodeEditorProps) {
  const controller = useController(CodeEditorController, props.bindings);
  controller.setDialect(props.dialect);

  return styled(useStyles(SqlEditorStyles))(
    <code-editor as="div" {...use({ readonly: props.readonly })} className={props.className}>
      <CodeMirror
        {...controller.bindings}
        value={props.value || ''}/>
    </code-editor>
  );
});
