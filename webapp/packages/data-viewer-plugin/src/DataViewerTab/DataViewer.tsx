/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { PropsWithChildren } from 'react';

import { TableViewer } from '../TableViewer/TableViewer';


type DataViewerProps = PropsWithChildren<{
  tabId: string;
  handlerId: string;
}>

export const DataViewer = function DataViewer({
  tabId,
}: DataViewerProps) {

  return <TableViewer tableId={tabId}/>;
};
