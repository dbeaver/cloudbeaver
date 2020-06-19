/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';
import styled, { css } from 'reshadow';

import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TableFooter } from './TableFooter/TableFooter';
import { TableGrid } from './TableGrid';
import { TableHeader } from './TableHeader/TableHeader';
import { TableViewerStorageService } from './TableViewerStorageService';

const viewerStyles = css`
  table-viewer {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

type TableViewerProps = PropsWithChildren<{
  tableId: string;
  className?: string;
}>

export const TableViewer = observer(function TableViewer({
  tableId,
  className,
}: TableViewerProps) {

  const tableViewerStorageService = useService(TableViewerStorageService);
  const tableViewerModel = tableViewerStorageService.get(tableId);

  if (!tableViewerModel) {
    return <Loader />;
  }

  return styled(viewerStyles)(
    <table-viewer as="div" className={className}>
      <TableHeader model={tableViewerModel} />
      <TableGrid model={tableViewerModel} />
      <TableFooter model={tableViewerModel} />
      <Loader loading={tableViewerModel.isLoaderVisible} overlay/>
    </table-viewer>
  );
});
