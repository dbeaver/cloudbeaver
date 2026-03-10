/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DatabaseDataModel } from '../DatabaseDataModel/DatabaseDataModel.js';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDatabaseDataOptions } from '../DatabaseDataModel/IDatabaseDataOptions.js';
import type { ResultSetDataSource } from './ResultSetDataSource.js';
import { isEditableDataSource } from './isEditableDataSource.js';

/**
 * Type guard that checks if a data model is editable at the specified result index.
 * Returns true only if the model is a DatabaseDataModel instance with an editable ResultSetDataSource.
 * Used to determine whether UI features like SQL generation, cell editing, and data modification should be enabled.
 */
export function isEditableDataModel<T = IDatabaseDataOptions>(
  dataModel: IDatabaseDataModel<any> | undefined | null,
  resultIndex: number,
): dataModel is IDatabaseDataModel<ResultSetDataSource<T>> {
  return dataModel instanceof DatabaseDataModel && isEditableDataSource(dataModel.source, resultIndex);
}
