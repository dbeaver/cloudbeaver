/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

export interface IDatabaseDataResult {
  id: string | null;
  uniqueResultId: string;
  dataFormat: ResultDataFormat;
  loadedFully: boolean;
  count: number;
  data: unknown;
}

export const IDatabaseDataResult = Context.Service<IDatabaseDataResult>(
  '@cloudbeaver/plugin-data-viewer/DatabaseDataModel/IDatabaseDataResult#IDatabaseDataResult',
);
