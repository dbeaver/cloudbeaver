import { computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

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

export function useResultSetActions({ model, resultIndex }: IResultActionsArgs) {
  return useObservableRef(
    () => ({
      get dataAction(): ResultSetDataAction {
        return this.model.source.getAction(this.resultIndex, ResultSetDataAction);
      },
      get selectAction(): ResultSetSelectAction {
        return this.model.source.getAction(this.resultIndex, ResultSetSelectAction);
      },
      get editAction(): ResultSetEditAction {
        return this.model.source.getAction(this.resultIndex, ResultSetEditAction);
      },
      get contentAction(): ResultSetDataContentAction {
        return this.model.source.getAction(this.resultIndex, ResultSetDataContentAction);
      },
      get formatAction(): ResultSetFormatAction {
        return this.model.source.getAction(this.resultIndex, ResultSetFormatAction);
      },
      get constraintAction(): ResultSetConstraintAction {
        return this.model.source.getAction(this.resultIndex, ResultSetConstraintAction);
      },
      get viewAction(): ResultSetViewAction {
        return this.model.source.getAction(this.resultIndex, ResultSetViewAction);
      },
    }),
    {
      dataAction: computed,
      selectAction: computed,
      editAction: computed,
      contentAction: computed,
      formatAction: computed,
      constraintAction: computed,
      viewAction: computed,
      model: observable.ref,
      resultIndex: observable.ref,
    },
    { model, resultIndex },
  );
}
