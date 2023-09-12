import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import type { IOutputLog } from './OutputLogsResource';

export interface SqlOutputLogsPanelState {
  searchValue: any;
  setSearchValue: (value: string) => void;
  selectedLogTypes: OutputLogType[];
  readonly resultValue: string;
  setSelectedLogTypes: (value: OutputLogType[]) => void;
  readonly filteredLogs: IOutputLog[];
}

export const OUTPUT_LOG_TYPES = ['Debug', 'Log', 'Info', 'Notice', 'Warning', 'Error'] as const;
export type OutputLogType = (typeof OUTPUT_LOG_TYPES)[number];
export const useOutputLogsPanelState = (outputLogs: IOutputLog[]) => {
  return useObservableRef<SqlOutputLogsPanelState>(
    () => ({
      searchValue: '',
      selectedLogTypes: [...OUTPUT_LOG_TYPES],
      setSearchValue(value: string) {
        this.searchValue = value;
      },
      setSelectedLogTypes(value: OutputLogType[]) {
        this.selectedLogTypes = value;
      },
      get filteredLogs() {
        return outputLogs.filter(log => {
          if (this.selectedLogTypes.length > 0 && !this.selectedLogTypes.includes(log.severity)) {
            return false;
          }
          if (this.searchValue.length > 0 && !log.message.includes(this.searchValue)) {
            return false;
          }
          return true;
        });
      },
      get resultValue() {
        return this.filteredLogs.map(log => `[${log.severity}] ${log.message}`).join('\n');
      },
    }),
    {
      searchValue: observable.ref,
      selectedLogTypes: observable.ref,
      setSearchValue: action.bound,
      setSelectedLogTypes: action.bound,
      filteredLogs: computed,
      resultValue: computed,
    },
    false,
  );
};
