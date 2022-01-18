/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';
import type { IDataPresentationProps } from '@cloudbeaver/plugin-data-viewer';

const loader = createComplexLoader(async function loader() {
  const { DataGridTable } = await import('./DataGridTable');
  return { DataGridTable };
});

export const DataGridLoader: React.FC<IDataPresentationProps> = function DataGridLoader(props) {
  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ DataGridTable }) => (
        <DataGridTable {...props} />
      )}
    </ComplexLoader>
  );
};
