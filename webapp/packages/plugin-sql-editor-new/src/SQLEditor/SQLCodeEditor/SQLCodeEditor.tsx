/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { EditorLoader, type IDefaultExtensions, type IEditorProps, type IEditorRef } from '@cloudbeaver/plugin-codemirror6';

export const SQLCodeEditor = observer<IEditorProps & IDefaultExtensions, IEditorRef>(
  forwardRef(function SQLCodeEditor(props, ref) {
    return <EditorLoader {...props} ref={ref} />;
  }),
);
