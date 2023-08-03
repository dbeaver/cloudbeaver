import { action } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import type { IResultSetGroupingData } from './DataContext/DATA_CONTEXT_DV_DDM_RS_GROUPING';
import type { IDVResultSetGroupingPresentationState } from './DVResultSetGroupingPresentation';

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
      },
      getFunctions() {
        return this.state.functions;
      },
      setFunctions(functions) {
        this.state.functions = functions;
      },
      shouldShowDuplicatesOnly() {
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
