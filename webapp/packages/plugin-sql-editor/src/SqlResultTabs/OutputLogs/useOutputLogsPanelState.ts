/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';
import type { WsOutputLogInfo } from '@cloudbeaver/core-sdk';

import type { ISqlEditorTabState } from '../../ISqlEditorTabState.js';
import type { IOutputLog } from './OutputLogsResource.js';

export interface SqlOutputLogsPanelState {
  searchValue: string;
  outputLogs: IOutputLog[];
  sqlEditorTabState: ISqlEditorTabState;
  setSearchValue: (value: string) => void;
  logMessages: WsOutputLogInfo['message'][];
  readonly resultValue: string;
  readonly filteredLogs: WsOutputLogInfo[];
}

export const useOutputLogsPanelState = (outputLogs: IOutputLog[], sqlEditorTabState: ISqlEditorTabState): SqlOutputLogsPanelState =>
  useObservableRef<SqlOutputLogsPanelState>(
    () => ({
      outputLogs,
      sqlEditorTabState,
      searchValue: '',
      setSearchValue(value: string) {
        this.searchValue = value;
      },
      get filteredLogs() {
        const selectedLogTypes = this.sqlEditorTabState.outputLogsTab?.selectedLogTypes;

        if (!selectedLogTypes?.length) {
          return [];
        }

        return this.outputLogs.filter(log => {
          if (log.severity && !selectedLogTypes.includes(log.severity)) {
            return false;
          }

          if (log.message && this.searchValue.length > 0 && !log.message.toLowerCase().includes(this.searchValue.toLowerCase())) {
            return false;
          }

          return true;
        });
      },
      get resultValue() {
        return this.filteredLogs
          .map(log => {
            let result = '';

            if (log.severity) {
              result += `[${log.severity}] `;
            }

            if (log.message) {
              result += log.message;
            }

            return result;
          })
          .join('\n');
      },
    }),
    {
      outputLogs: observable.ref,
      sqlEditorTabState: observable.ref,
      searchValue: observable.ref,
      setSearchValue: action.bound,
      filteredLogs: computed,
      resultValue: computed,
    },
    {
      outputLogs,
      sqlEditorTabState,
    },
  );
