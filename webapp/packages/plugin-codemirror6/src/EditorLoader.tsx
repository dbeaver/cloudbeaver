/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

import { ComplexLoader, createComplexLoader } from '@cloudbeaver/core-blocks';

import type { IDefaultExtensions } from './getDefaultExtensions';
import type { IEditorProps } from './IEditorProps';
import type { IEditorRef } from './IEditorRef';

const loader = createComplexLoader(async function loader() {
  const { Editor } = await import('./Editor');
  return { Editor };
});

export const EditorLoader = forwardRef<IEditorRef, IEditorProps & IDefaultExtensions>(function EditorLoader(props, ref) {
  return (
    <ComplexLoader loader={loader}>
      {({ Editor }) => <Editor {...props} ref={ref} />}
    </ComplexLoader>
  );
});
