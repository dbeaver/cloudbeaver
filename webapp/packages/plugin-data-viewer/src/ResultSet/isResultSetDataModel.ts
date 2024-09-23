/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DatabaseDataModel } from '../DatabaseDataModel/DatabaseDataModel.js';
import { type IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import { type IDatabaseDataOptions } from '../DatabaseDataModel/IDatabaseDataOptions.js';
import { ResultSetDataSource } from './ResultSetDataSource.js';

export function isResultSetDataModel<T = IDatabaseDataOptions>(
  dataModel: IDatabaseDataModel<any> | undefined | null,
): dataModel is IDatabaseDataModel<ResultSetDataSource<T>> {
  return dataModel instanceof DatabaseDataModel && dataModel.source instanceof ResultSetDataSource;
}
