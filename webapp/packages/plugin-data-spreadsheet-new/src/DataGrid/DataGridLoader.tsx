/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ComplexLoader, createComplexLoader } from '@cloudbeaver/core-blocks';
import type { IDataPresentationProps } from '@cloudbeaver/plugin-data-viewer';

const loader = createComplexLoader(async function loader() {
  const { DataGridTable } = await import('./DataGridTable.js');
  return { DataGridTable };
});

export const DataGridLoader: React.FC<IDataPresentationProps> = function DataGridLoader(props) {
  return <ComplexLoader loader={loader}>{({ DataGridTable }) => <DataGridTable {...props} />}</ComplexLoader>;
};
