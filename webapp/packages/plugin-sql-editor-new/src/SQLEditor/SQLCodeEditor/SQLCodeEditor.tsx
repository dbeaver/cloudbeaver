/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useMemo } from 'react';

import { EditorLoader, Extension, getDefaultExtensions, IEditorProps, IEditorRef } from '@cloudbeaver/plugin-codemirror6';

export const SQLCodeEditor = observer<IEditorProps, IEditorRef>(forwardRef(function SQLCodeEditor(props, ref) {
  const extensions: Extension[] = [];
  const defaultExtensions = useMemo(getDefaultExtensions, []);

  extensions.push(...defaultExtensions);

  if (props.extensions) {
    extensions.push(props.extensions);
  }

  return <EditorLoader {...props} ref={ref} extensions={extensions} />;
}));