/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';

import type { ISqlEditorProps } from './ISqlEditorProps';

const loader = createComplexLoader(async function loader() {
  const { SqlEditor } = await import('./SqlEditor');
  return { SqlEditor };
});

export const SqlEditorLoader = observer<ISqlEditorProps>(function SqlEditorLoader(props) {
  return (
    <ComplexLoader loader={loader} placeholder={<Loader />}>
      {({ SqlEditor }) => <SqlEditor {...props} />}
    </ComplexLoader>
  );
});
