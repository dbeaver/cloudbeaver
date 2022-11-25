/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';

import type { ICodeEditorProps } from './ICodeEditorProps';

const loader = createComplexLoader(async function loader() {
  const { CodeEditor } = await import('./CodeEditor');
  return { CodeEditor };
});

export const CodeEditorLoader: React.FC<ICodeEditorProps> = function CodeEditorLoader(props) {
  return (
    <ComplexLoader loader={loader} placeholder={<Loader />}>
      {({ CodeEditor }) => <CodeEditor {...props} />}
    </ComplexLoader>
  );
};
