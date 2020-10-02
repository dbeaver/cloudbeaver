/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DataModelWrapper, IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

import { AgGridTable } from './AgGridTable/AgGridTable';

type Props = {
  model: IDatabaseDataModel<any, any>;
  className?: string;
}

export function Spreadsheet({
  model,
  className,
}: Props) {
  const deprecated = (model as DataModelWrapper).deprecatedModel;

  return <AgGridTable tableModel={deprecated} className={className} />;
}
