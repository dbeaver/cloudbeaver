/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ComplexLoader, createComplexLoader } from '@cloudbeaver/core-blocks';

import type { IEditorProps } from './IEditorProps';

const loader = createComplexLoader(async function loader() {
  const { Editor } = await import('./Editor');
  return { Editor };
});

export const EditorLoader: React.FC<IEditorProps> = function EditorLoader(props) {
  return (
    <ComplexLoader loader={loader}>
      {({ Editor }) => <Editor {...props} />}
    </ComplexLoader>
  );
};
