/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { EditorLoader } from '@cloudbeaver/plugin-codemirror6';

import type { ISQLCodeEditorProps } from './ISQLCodeEditorProps';

export const SQLCodeEditor = observer<ISQLCodeEditorProps>(forwardRef(function SQLCodeEditor(props, ref) {
  return <EditorLoader {...props} />;
}));