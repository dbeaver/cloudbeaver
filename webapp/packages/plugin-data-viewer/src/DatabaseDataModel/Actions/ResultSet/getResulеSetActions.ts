import type { IDatabaseDataModel } from '../../IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { ResultSetConstraintAction } from './ResultSetConstraintAction';
import { ResultSetDataAction } from './ResultSetDataAction';
import { ResultSetDataContentAction } from './ResultSetDataContentAction';
import { ResultSetEditAction } from './ResultSetEditAction';
import { ResultSetFormatAction } from './ResultSetFormatAction';
import { ResultSetSelectAction } from './ResultSetSelectAction';
import { ResultSetViewAction } from './ResultSetViewAction';

interface IResultActionsArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}

export function getResultSetActions({ model, resultIndex }: IResultActionsArgs) {
  return {
    dataAction: model.source.getAction(resultIndex, ResultSetDataAction),
    selectAction: model.source.getAction(resultIndex, ResultSetSelectAction),
    editAction: model.source.getAction(resultIndex, ResultSetEditAction),
    contentAction: model.source.getAction(resultIndex, ResultSetDataContentAction),
    formatAction: model.source.getAction(resultIndex, ResultSetFormatAction),
    constraintAction: model.source.getAction(resultIndex, ResultSetConstraintAction),
    viewAction: model.source.getAction(resultIndex, ResultSetViewAction),
  };
}
