/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { WsOutputLogInfo } from '@cloudbeaver/core-sdk';

export interface SqlOutputLogsPanelState {
  searchValue: string;
  setSearchValue: (value: string) => void;
  logMessages: WsOutputLogInfo['message'][];
  selectedLogTypes: OutputLogType[];
  readonly resultValue: string;
  setSelectedLogTypes: (value: OutputLogType[]) => void;
  readonly filteredLogs: WsOutputLogInfo[];
}

export const OUTPUT_LOG_TYPES = ['Debug', 'Log', 'Info', 'Notice', 'Warning', 'Error'] as const;
export type OutputLogType = (typeof OUTPUT_LOG_TYPES)[number];

export const useOutputLogsPanelState = (outputLogs: WsOutputLogInfo[]) =>
  useObservableRef<SqlOutputLogsPanelState>(
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
          if (this.selectedLogTypes.length > 0 && !this.selectedLogTypes.includes(log?.severity as OutputLogType)) {
            return false;
          }
          if (this.searchValue.length > 0 && !log?.message?.includes(this.searchValue)) {
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
