/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { type InputAutocompleteProposal, useObservableRef } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';

import { DatabaseDataConstraintAction } from '../../DatabaseDataModel/Actions/DatabaseDataConstraintAction.js';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDatabaseDataOptions } from '../../DatabaseDataModel/IDatabaseDataOptions.js';
import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';
import { isResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';

interface IState {
  model: IDatabaseDataModel;
  resultIndex: number;
  readonly supported: boolean;
  readonly filter: string;
  readonly columns: SqlResultColumn[];
  readonly hintProposals: InputAutocompleteProposal[];
  readonly constraints: DatabaseDataConstraintAction | null;
  readonly disabled: boolean;
  readonly applicableFilter: boolean;
  set: (value: string) => void;
  apply: () => Promise<void>;
}

const BASE_HINTS: InputAutocompleteProposal[] = [
  {
    displayString: 'AND',
    replacementString: 'AND',
    score: 0,
  },
  {
    displayString: 'OR',
    replacementString: 'OR',
    score: 0,
  },
  {
    displayString: 'ILIKE',
    replacementString: 'ILIKE',
    score: 0,
  },
  {
    displayString: 'LIKE',
    replacementString: 'LIKE',
    score: 0,
  },
  {
    displayString: 'IN',
    replacementString: 'IN',
    score: 0,
  },
  {
    displayString: 'BETWEEN',
    replacementString: 'BETWEEN',
    score: 0,
  },
];

export function useWhereFilter(model: IDatabaseDataModel, resultIndex: number): Readonly<IState> {
  return useObservableRef(
    () => ({
      get supported() {
        return isResultSetDataSource(this.model.source);
      },
      get filter() {
        const source = this.model.source;
        if (!isResultSetDataSource<IDatabaseDataOptions>(source)) {
          return '';
        }

        if (this.constraints?.filterConstraints.length && this.model.source.requestInfo.requestFilter) {
          return this.model.requestInfo.requestFilter;
        }

        return source.options?.whereFilter ?? '';
      },
      get columns() {
        const model = this.model as any;

        if (!model.source.hasResult(this.resultIndex) || !isResultSetDataModel(model)) {
          return [];
        }

        const view = model.source.tryGetAction(resultIndex, ResultSetViewAction);

        if (!view) {
          return [];
        }

        return view?.columns ?? [];
      },
      get hintProposals() {
        return [...BASE_HINTS].concat(
          this.columns.map(column => ({
            title: column.label || '',
            displayString: column.label || '',
            replacementString: column.label || '',
            icon: column.icon || '',
            score: 1,
          })),
        );
      },
      get constraints() {
        const model = this.model as any;
        if (!model.source.hasResult(this.resultIndex) || !isResultSetDataModel(model)) {
          return null;
        }

        return model.source.tryGetAction(this.resultIndex, DatabaseDataConstraintAction) ?? null;
      },
      get disabled() {
        const supported = this.constraints?.supported ?? false;
        return !supported || this.model.isLoading() || this.model.isDisabled(resultIndex);
      },
      get applicableFilter() {
        const source = this.model.source;
        if (!isResultSetDataSource<IDatabaseDataOptions>(source)) {
          return false;
        }
        return source.prevOptions?.whereFilter !== source.options?.whereFilter || source.options?.whereFilter !== source.requestInfo.requestFilter;
      },
      set(value: string) {
        if (!this.constraints) {
          return;
        }

        this.constraints.deleteFilters();
        this.constraints.setWhereFilter(value);
      },
      async apply() {
        if (!this.applicableFilter || this.model.isLoading() || this.model.isDisabled(this.resultIndex)) {
          return;
        }

        await this.model.request();
      },
    }),
    {
      model: observable.ref,
      resultIndex: observable.ref,
      filter: computed,
      columns: computed,
      hintProposals: computed,
      constraints: computed,
      disabled: computed,
      applicableFilter: computed,
      set: action.bound,
      apply: action.bound,
    },
    { model, resultIndex },
  );
}
