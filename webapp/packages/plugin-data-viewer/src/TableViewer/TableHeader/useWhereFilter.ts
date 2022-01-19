/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, computed } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import { ResultSetConstraintAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataOptions } from '../../DatabaseDataModel/IDatabaseDataOptions';

interface IState {
  model: IDatabaseDataModel<IDatabaseDataOptions, any>;
  resultIndex: number;
  readonly filter: string;
  readonly constraints: ResultSetConstraintAction | null;
  readonly disabled: boolean;
  readonly applicableFilter: boolean;
  set: (value: string) => void;
  apply: () => Promise<void>;
}

export function useWhereFilter(
  model: IDatabaseDataModel<IDatabaseDataOptions, any>,
  resultIndex: number
): Readonly<IState> {
  return useObservableRef(() => ({
    get filter() {
      if (this.constraints?.filterConstraints.length && this.model.source.requestInfo.requestFilter) {
        return this.model.requestInfo.requestFilter;
      }

      return this.model.source.options?.whereFilter ?? '';
    },
    get constraints() {
      if (!this.model.source.hasResult(this.resultIndex)) {
        return null;
      }

      return this.model.source.tryGetAction(this.resultIndex, ResultSetConstraintAction) ?? null;
    },
    get disabled() {
      const supported = this.constraints?.supported ?? false;
      return !supported || this.model.isLoading() || this.model.isDisabled(resultIndex);
    },
    get applicableFilter() {
      return this.model.source.prevOptions?.whereFilter !== this.model.source.options?.whereFilter
        || this.model.source.options?.whereFilter !== this.model.source.requestInfo.requestFilter;
    },
    set(value: string) {
      if (this.constraints) {
        this.constraints.deleteFilters();
      }

      if (this.model.source.options) {
        this.model.source.options.whereFilter = value;
      }
    },
    async apply() {
      if (!this.applicableFilter || this.model.isLoading() || this.model.isDisabled(this.resultIndex)) {
        return;
      }

      await this.model.request();
    },
  }),
    {
      filter: computed,
      constraints: computed,
      disabled: computed,
      applicableFilter: computed,
      set: action.bound,
      apply: action.bound,
    },
    { model, resultIndex });
}
