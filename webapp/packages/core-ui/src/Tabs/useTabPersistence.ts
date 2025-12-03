/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useRef } from 'react';
import { runInAction } from 'mobx';

import { useUserData, useExecutor } from '@cloudbeaver/core-blocks';
import { isArraysEqual } from '@cloudbeaver/core-utils';
import { isDefined } from '@dbeaver/js-helpers';

import type { TabsContainer } from './TabsContainer/TabsContainer.js';

interface ITabPersistenceState {
  selectedTabId: string | undefined;
}

export function useTabPersistence(panelId: string, container: TabsContainer) {
  const state = useUserData<ITabPersistenceState>(panelId, () => ({ selectedTabId: undefined }));

  const tabs = container.getIdList();
  const prevTabs = useRef<string[]>(tabs);
  const equal = isArraysEqual(prevTabs.current, tabs);

  const selectTab = useCallback(
    (tabId: string) => {
      state.selectedTabId = tabId;
    },
    [state],
  );

  useExecutor({
    executor: container.onTabSelect,
    handlers: [
      function selectTabHandler(tabId) {
        selectTab(tabId);
      },
    ],
  });

  runInAction(() => {
    if (!equal) {
      for (const id of tabs) {
        if (!prevTabs.current.includes(id)) {
          state.selectedTabId = id;
          break;
        }
      }

      prevTabs.current = tabs;
    }

    if (isDefined(state.selectedTabId)) {
      if (!tabs.includes(state.selectedTabId)) {
        if (tabs.length > 0) {
          state.selectedTabId = tabs[0];
        } else {
          state.selectedTabId = undefined;
        }
      }
    }
  });

  return {
    selectedTabId: state.selectedTabId,
    selectTab,
  };
}
