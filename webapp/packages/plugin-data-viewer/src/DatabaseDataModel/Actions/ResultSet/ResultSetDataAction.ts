import { IExecutor, Executor } from '@cloudbeaver/core-executor';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseResultDataAction } from '../IDatabaseDataAction';
import type { DatabaseDataEditorActionsData } from '../IDatabaseDataSelectAction';
import type { IResultSetElementKey } from './IResultSetElementKey';

@databaseDataAction()
export class ResultSetDataAction implements IDatabaseResultDataAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;
  result: IDatabaseResultSet;

  readonly actions: IExecutor<DatabaseDataEditorActionsData<IResultSetElementKey>>;

  constructor(
    result: IDatabaseResultSet) {
    this.result = result;
    this.actions = new Executor();
  }

  getCellValue(cell: IResultSetElementKey): any {
    if (cell.row === undefined || cell.column === undefined || !this.result.data?.rows) {
      return undefined;
    }

    return this.result.data.rows[cell.row][cell.column];
  }

  updateResult(result: IDatabaseResultSet) {
    this.result = result;
  }
}
