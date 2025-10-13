/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat, type SqlResultColumn, type SqlResultRowMetaData } from '@cloudbeaver/core-sdk';

import { IDatabaseDataSource } from '../../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet.js';
import { ResultSetDataAction } from './ResultSetDataAction.js';
import { ResultSetEditAction } from './ResultSetEditAction.js';
import type { IResultSetValue } from './ResultSetFormatAction.js';
import { ResultSetViewAction } from './ResultSetViewAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../../IDatabaseDataResult.js';
import { GridSelectAction } from '../Grid/GridSelectAction.js';
import type { IGridDataKey } from '../Grid/IGridDataKey.js';
import type { IDatabaseDataEditAction, IDatabaseDataEditApplyActionData } from '../IDatabaseDataEditAction.js';

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult, ResultSetDataAction, ResultSetViewAction, ResultSetEditAction])
export class ResultSetSelectAction extends GridSelectAction<
  SqlResultColumn,
  SqlResultRowMetaData,
  IResultSetValue,
  IGridDataKey,
  IDatabaseResultSet
> {
  static override dataFormat = [ResultDataFormat.Resultset];

  constructor(
    source: IDatabaseDataSource,
    result: IDatabaseDataResult,
    data: ResultSetDataAction,
    view: ResultSetViewAction,
    edit: ResultSetEditAction,
  ) {
    super(
      source as unknown as IDatabaseDataSource<unknown, IDatabaseResultSet>,
      result as IDatabaseResultSet,
      data,
      view,
      edit as unknown as IDatabaseDataEditAction<unknown, IResultSetValue, IDatabaseDataEditApplyActionData, IDatabaseResultSet>,
    );
  }
}
