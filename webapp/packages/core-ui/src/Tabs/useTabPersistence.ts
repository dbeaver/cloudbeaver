/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useMemo, useRef } from 'react';
import { untracked, action } from 'mobx';

import { useUserData, useExecutor } from '@cloudbeaver/core-blocks';
import { isArraysEqual } from '@cloudbeaver/core-utils';

import type { TabsContainer } from './TabsContainer/TabsContainer.js';

interface ITabPersistenseState {
  selectedTabId: string | undefined;
}

export function useTabPersistence(panelId: string, container: TabsContainer) {
  const state = useUserData<ITabPersistenseState>(panelId, () => ({ selectedTabId: undefined }));

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

  untracked(
    action(() => {
      if (!equal) {
        for (const id of tabs) {
          if (!prevTabs.current.includes(id)) {
            state.selectedTabId = id;
            break;
          }
        }

        prevTabs.current = tabs;
      }

      if (state.selectedTabId) {
        if (!tabs.includes(state.selectedTabId)) {
          if (tabs.length > 0) {
            state.selectedTabId = tabs[0];
          } else {
            state.selectedTabId = undefined;
          }
        }
      }
    }),
  );

  const result = useMemo(() => ({ selectedTabId: state.selectedTabId, selectTab }), [state.selectedTabId, selectTab]);
  return result;
}
