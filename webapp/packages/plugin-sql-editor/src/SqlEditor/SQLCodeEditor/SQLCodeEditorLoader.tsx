/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';

import type { ISQLCodeEditorProps } from './ISQLCodeEditorProps';
import type { SQLCodeEditorController } from './SQLCodeEditorController';

const loader = createComplexLoader(async function loader() {
  const { SQLCodeEditor } = await import('./SQLCodeEditor');
  return { SQLCodeEditor };
});

export const SQLCodeEditorLoader = observer<ISQLCodeEditorProps, SQLCodeEditorController>(function SQLCodeEditorLoader(props, ref) {
  return (
    <ComplexLoader loader={loader} placeholder={<Loader />}>
      {({ SQLCodeEditor }) => <SQLCodeEditor {...props} ref={ref} />}
    </ComplexLoader>
  );
}, { forwardRef: true });
