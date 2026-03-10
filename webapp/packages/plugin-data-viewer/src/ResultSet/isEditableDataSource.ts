/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IDatabaseDataSource } from '../DatabaseDataModel/IDatabaseDataSource.js';
import { type ResultSetDataSource, isResultSetDataSource } from './ResultSetDataSource.js';

/**
 * Type guard that checks if a data source supports editing operations at the specified result index.
 * Returns true for data sources that inherently support editing (e.g., ContainerDataSource, QueryDataSource,
 * DatasetDataSource, SubCollectionDataSource) and are not marked as readonly for the given result.
 * Returns false for readonly-by-nature sources (e.g., GroupingDataSource, DatabaseSessionManagerDataSource)
 * or when the result index is marked as readonly.
 *
 * Used throughout the application to determine whether editing features should be enabled:
 * - Cell editing menu items (add, duplicate, delete rows)
 * - SQL generation commands (INSERT, UPDATE, DELETE)
 * - Undo/Redo history actions
 * - Data modification operations
 */
export function isEditableDataSource<TOptions = unknown>(
  dataSource: IDatabaseDataSource<any, any> | undefined | null,
  resultIndex: number,
): dataSource is ResultSetDataSource<TOptions> {
  return dataSource != null && isResultSetDataSource(dataSource) && !dataSource.isReadonly(resultIndex);
}
