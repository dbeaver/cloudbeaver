/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { type DataTypeLogicalOperation, ResultDataFormat, type SqlResultColumn, type SqlResultRowMetaData } from '@cloudbeaver/core-sdk';
import { type IResultSetComplexValue, isResultSetContentValue } from '@dbeaver/result-set-api';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { ResultSetEditAction } from './ResultSetEditAction.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';
import { GridViewAction } from '../Grid/GridViewAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import type { IGridColumnKey, IGridDataKey } from '../Grid/IGridDataKey.js';
import type { IDatabaseDataEditAction } from '../IDatabaseDataEditAction.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, ResultSetDataAction, ResultSetEditAction])
export class ResultSetViewAction extends GridViewAction<SqlResultColumn, SqlResultRowMetaData, IGridDataKey, IResultSetValue, IDatabaseResultSet> {
  static override dataFormat = [ResultDataFormat.Resultset];

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult, data: ResultSetDataAction, editor: ResultSetEditAction) {
    super(
      source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>,
      result as IDatabaseResultSet,
      data,
      editor as unknown as IDatabaseDataEditAction,
    );
  }

  getContent(cell: IGridDataKey): IResultSetComplexValue | null {
    const holder = this.getCellHolder(cell);

    if (isResultSetContentValue(holder.value)) {
      return holder.value;
    }

    return null;
  }

  getColumnOperations(key: IGridColumnKey): DataTypeLogicalOperation[] {
    const column = this.getColumn(key);

    if (!column) {
      return [];
    }

    return column.supportedOperations.filter(operation => operation.argumentCount === 1 || operation.argumentCount === 0);
  }
}
