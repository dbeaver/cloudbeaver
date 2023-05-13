/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useMemo } from 'react';

import { EditorLoader, Extension, getDefaultExtensions, IDefaultExtensions, IEditorProps, IEditorRef } from '@cloudbeaver/plugin-codemirror6';

export const SQLCodeEditor = observer<IEditorProps & IDefaultExtensions, IEditorRef>(forwardRef(function SQLCodeEditor({
  lineNumbers,
  extensions,
  ...rest
}, ref) {
  const combinedExtensions: Extension[] = [];
  const defaultExtensions = useMemo(() => getDefaultExtensions({ lineNumbers }), [lineNumbers]);

  combinedExtensions.push(...defaultExtensions);

  if (extensions) {
    combinedExtensions.push(extensions);
  }

  return <EditorLoader {...rest} ref={ref} extensions={combinedExtensions} />;
}));