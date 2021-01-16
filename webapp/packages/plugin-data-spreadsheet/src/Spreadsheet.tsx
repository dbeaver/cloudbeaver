/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { DataModelWrapper, IDataPresentationProps } from '@cloudbeaver/plugin-data-viewer';

import { AgGridTableLoader } from './AgGridTable/AgGridTableLoader';

export const Spreadsheet: React.FC<IDataPresentationProps> = observer(function Spreadsheet({
  model,
  resultIndex,
  className,
}) {
  const deprecated = (model as DataModelWrapper).getOldModel(resultIndex);

  if (!deprecated || (model.results.length === 0 && model.isLoading())) {
    return null;
  }

  return <AgGridTableLoader tableModel={deprecated} className={className} />;
});
