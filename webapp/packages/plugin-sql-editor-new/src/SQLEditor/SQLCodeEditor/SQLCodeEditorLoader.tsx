/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { ComplexLoader, createComplexLoader } from '@cloudbeaver/core-blocks';
import type { IDefaultExtensions, IEditorProps, IEditorRef } from '@cloudbeaver/plugin-codemirror6';

const loader = createComplexLoader(async function loader() {
  const { SQLCodeEditor } = await import('./SQLCodeEditor.js');
  return { SQLCodeEditor };
});

export const SQLCodeEditorLoader = observer<IEditorProps & IDefaultExtensions, IEditorRef>(
  forwardRef(function SQLCodeEditorLoader(props, ref) {
    return <ComplexLoader loader={loader}>{({ SQLCodeEditor }) => <SQLCodeEditor {...props} ref={ref} />}</ComplexLoader>;
  }),
);
