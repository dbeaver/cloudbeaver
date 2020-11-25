/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';

import { AgGridReactProps } from '@ag-grid-community/react';
import { ComplexLoader, Loader } from '@cloudbeaver/core-blocks';
import { TableViewerModel } from '@cloudbeaver/plugin-data-viewer';

export type AgGridTableProps = PropsWithChildren<
AgGridReactProps & {
  tableModel: TableViewerModel;
  className?: string;
}>;

async function loader() {
  const { AgGridTable } = await import('./AgGridTable');

  return { AgGridTable };
}

export const AgGridTableLoader = observer(function AgGridTableLoader({
  tableModel,
  className,
  ...rest
}: AgGridTableProps) {
  return (
    <ComplexLoader
      loader={loader}
      placeholder={<Loader />}
    >
      {({ AgGridTable }) => (
        <AgGridTable
          tableModel={tableModel}
          className={className}
          {...rest}
        />
      )}
    </ComplexLoader>
  );
});
