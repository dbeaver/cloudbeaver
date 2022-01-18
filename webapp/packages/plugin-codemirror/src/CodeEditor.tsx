/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useLayoutEffect, useRef } from 'react';
import { Controlled as CodeMirror } from 'react-codemirror2';
import styled, { use } from 'reshadow';

import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/htmlembedded/htmlembedded';
import 'codemirror/mode/htmlmixed/htmlmixed';
import 'codemirror/mode/meta';
import 'codemirror/addon/hint/show-hint';
import 'codemirror/addon/selection/mark-selection';
import 'codemirror/lib/codemirror.css';
import 'codemirror/addon/hint/show-hint.css';

import { useStyles } from '@cloudbeaver/core-theming';

import type { ICodeEditorProps } from './ICodeEditorProps';
import { SqlEditorStyles } from './theme';
import { useAutoFormat } from './useAutoFormat';

export const CodeEditor = observer<ICodeEditorProps>(function CodeEditor(props) {
  const { readonly, autoFormat, className, editorDidMount } = props;

  const formatter = useAutoFormat(props.options?.mode);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<CodeMirror.Editor | null>(null);
  let value = props.value;

  if (autoFormat) {
    value = formatter.format(value);
  }

  useLayoutEffect(() => {
    const observable = wrapperRef.current;

    if (!observable) {
      return;
    }

    const observer = new ResizeObserver(() => {
      editorRef.current?.refresh();
    });

    observer.observe(observable);

    return () => observer.unobserve(observable);
  }, []);

  const handleMount = useCallback((editor: CodeMirror.Editor, value: string, cb: () => void) => {
    editorRef.current = editor;

    if (editorDidMount) {
      editorDidMount(editor, value, cb);
    }
  }, [editorDidMount]);

  return styled(useStyles(SqlEditorStyles))(
    <code-editor ref={wrapperRef} {...use({ readonly })} className={className}>
      <CodeMirror
        {...props}
        value={value}
        editorDidMount={handleMount}
        options={{ styleSelectedText: true, ...props.options }}
      />
    </code-editor>
  );
});
