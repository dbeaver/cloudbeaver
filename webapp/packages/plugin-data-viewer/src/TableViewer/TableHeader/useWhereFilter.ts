/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import { DatabaseDataConstraintAction } from '../../DatabaseDataModel/Actions/DatabaseDataConstraintAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import type { IDatabaseDataOptions } from '../../DatabaseDataModel/IDatabaseDataOptions.js';
import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';
import { isResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';

interface IState {
  model: IDatabaseDataModel;
  resultIndex: number;
  readonly supported: boolean;
  readonly filter: string;
  readonly constraints: DatabaseDataConstraintAction | null;
  readonly disabled: boolean;
  readonly applicableFilter: boolean;
  set: (value: string) => void;
  apply: () => Promise<void>;
}

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
      constraints: computed,
      disabled: computed,
      applicableFilter: computed,
      set: action.bound,
      apply: action.bound,
    },
    { model, resultIndex },
  );
}
