/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DataModelWrapper } from '@cloudbeaver/plugin-data-viewer';

import { AgGridTable } from './AgGridTable/AgGridTable';

type Props = {
  tableModel: DataModelWrapper;
  className?: string;
}

export function Spreadsheet({
  tableModel,
  className,
}: Props) {

  return <AgGridTable tableModel={tableModel.deprecatedModel} className={className} />;
}
