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

export function useResultActions({ model, resultIndex }: IResultActionsArgs) {
  return {
    get dataAction(): ResultSetDataAction {
      return model.source.getAction(resultIndex, ResultSetDataAction);
    },
    get selectAction(): ResultSetSelectAction {
      return model.source.getAction(resultIndex, ResultSetSelectAction);
    },
    get editAction(): ResultSetEditAction {
      return model.source.getAction(resultIndex, ResultSetEditAction);
    },
    get contentAction(): ResultSetDataContentAction {
      return model.source.getAction(resultIndex, ResultSetDataContentAction);
    },
    get formatAction(): ResultSetFormatAction {
      return model.source.getAction(resultIndex, ResultSetFormatAction);
    },
    get constraintAction(): ResultSetConstraintAction {
      return model.source.getAction(resultIndex, ResultSetConstraintAction);
    },
    get viewAction(): ResultSetViewAction {
      return model.source.getAction(resultIndex, ResultSetViewAction);
    },
  };
}
