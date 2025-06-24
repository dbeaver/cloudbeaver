/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

export interface SqlOutputLogsPanelState {
  searchValue: string;
  setSearchValue: (value: string) => void;
}
export const useOutputLogsPanelState = () =>
  useObservableRef<SqlOutputLogsPanelState>(
    () => ({
      searchValue: '',
      setSearchValue(value: string) {
        this.searchValue = value;
      },
    }),
    {
      searchValue: observable.ref,
      setSearchValue: action.bound,
    },
    false,
  );
