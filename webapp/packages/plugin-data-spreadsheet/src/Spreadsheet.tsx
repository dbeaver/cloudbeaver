/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TableViewerModel } from '@cloudbeaver/plugin-data-viewer';

import { AgGridTable } from './AgGridTable/AgGridTable';

type Props = {
  tableModel: TableViewerModel;
  className?: string;
}

export function Spreadsheet({
  tableModel,
  className,
}: Props) {

  return <AgGridTable tableModel={tableModel} className={className} />;
}
