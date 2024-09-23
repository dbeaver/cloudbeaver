/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ComplexLoader, createComplexLoader } from '@cloudbeaver/core-blocks';

import type { ISqlEditorProps } from './ISqlEditorProps.js';

const loader = createComplexLoader(async function loader() {
  const { SqlEditor } = await import('./SqlEditor.js');
  return { SqlEditor };
});

export const SqlEditorLoader = observer<ISqlEditorProps>(function SqlEditorLoader(props) {
  return <ComplexLoader loader={loader}>{({ SqlEditor }) => <SqlEditor {...props} />}</ComplexLoader>;
});
