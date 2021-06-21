/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ComplexLoader, createComplexLoader, Loader } from '@cloudbeaver/core-blocks';
import type { IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

interface Props {
  tableModel: IDatabaseDataModel<any, any>;
  resultIndex: number;
  className?: string;
}

const loader = createComplexLoader(async function loader() {
  const { DataGridTable } = await import('./DataGridTable');
  return { DataGridTable };
});

export const DataGridLoader: React.FC<Props> = function DataGridLoader({
  tableModel, resultIndex, className,
}) {
  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ DataGridTable }) => (
        <DataGridTable model={tableModel} resultIndex={resultIndex} className={className} />
      )}
    </ComplexLoader>
  );
};
