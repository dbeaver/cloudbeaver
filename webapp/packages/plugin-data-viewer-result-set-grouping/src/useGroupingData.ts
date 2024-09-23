/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import type { IResultSetGroupingData } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING.js';
import { DEFAULT_GROUPING_QUERY_OPERATION } from './DEFAULT_GROUPING_QUERY_OPERATION.js';
import type { IDVResultSetGroupingPresentationState } from './IDVResultSetGroupingPresentationState.js';

export interface IPrivateGroupingData extends IResultSetGroupingData {
  state: IDVResultSetGroupingPresentationState;
}

export function useGroupingData(state: IDVResultSetGroupingPresentationState) {
  return useObservableRef<IPrivateGroupingData>(
    () => ({
      getColumns() {
        return this.state.columns;
      },
      setColumns(columns) {
        this.state.columns = columns;
      },
      removeColumn(...columns) {
        this.state.columns = this.state.columns.filter(column => !columns.includes(column));
      },
      addColumn(column) {
        this.state.columns = [...this.state.columns, column];
      },
      clear() {
        this.state.presentationId = '';
        this.state.columns = [];
        this.state.functions = [DEFAULT_GROUPING_QUERY_OPERATION];
        this.state.showDuplicatesOnly = false;
      },
      getFunctions() {
        return this.state.functions;
      },
      setFunctions(functions) {
        this.state.functions = functions;
      },
      getShowDuplicatesOnly() {
        return this.state.showDuplicatesOnly;
      },
      setShowDuplicatesOnly(showDuplicatesOnly) {
        this.state.showDuplicatesOnly = showDuplicatesOnly;
      },
    }),
    {
      clear: action,
      setColumns: action,
      addColumn: action,
      removeColumn: action,
      setFunctions: action,
      setShowDuplicatesOnly: action,
    },
    { state },
  );
}
