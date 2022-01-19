/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@cloudbeaver/core-di';

import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

export function useDataModel<T extends IDatabaseDataModel<any, any>>(modelId: string): T | undefined {
  const dataViewerTableService = useService(TableViewerStorageService);

  return dataViewerTableService.get(modelId);
}
