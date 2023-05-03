/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { EditorLoader, getDefaultExtensions, IEditorProps, IEditorRef, SQL_EDITOR } from '@cloudbeaver/plugin-codemirror6';

export const SQLCodeEditor = observer<IEditorProps, IEditorRef>(forwardRef(function SQLCodeEditor(props, ref) {
  const extensions = [getDefaultExtensions(), SQL_EDITOR()];

  if (props.extensions) {
    extensions.push(props.extensions);
  }

  return <EditorLoader {...props} ref={ref} extensions={extensions} />;
}));