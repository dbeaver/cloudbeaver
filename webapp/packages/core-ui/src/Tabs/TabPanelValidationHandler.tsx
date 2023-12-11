/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useRef, useState } from 'react';
import { TabsContext } from './TabsContext';
import { FormContext, useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { TabPanelValidationHandlerContext } from './TabPanelValidationHandlerContext';
import { SyncExecutor } from '@cloudbeaver/core-executor';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

export interface ITabPanelHandlerProps {
  children: React.ReactNode;
}

export const TabPanelValidationHandler = observer(function TabPanelValidationHandler({ children }: ITabPanelHandlerProps) {
  const state = useContext(TabsContext);
  const formContext = useContext(FormContext);
  const selectedTab = state?.state.selectedId;
  const invalidTabs = useRef<Set<string>>(new Set());
  const [resetExecutor] = useState(() => new SyncExecutor());
  const notificationService = useService(NotificationService);

  if (!state) {
    throw new Error('TabsState should be defined');
  }

  function resetInvalidTabs() {
    invalidTabs.current = new Set();
  }

  const validate = useCallback(async (tabId: string) => {
    invalidTabs.current.add(tabId);
  
    setTimeout(() => {
      const next = Array.from(invalidTabs.current)[0];

      if (
        !selectedTab || 
        !invalidTabs.current.size || 
        invalidTabs.current.has(selectedTab)
      ) {
        return;
      }

      state.open(next).then(() => {
        formContext?.reportValidity();
      }).catch(() => {
        notificationService.logError({ title: 'core_ui_form_save_error', message: 'core_ui_switch_tab_error' });
      });
    }, 0);
  }, [selectedTab, state, formContext]);

  useExecutor({
    executor: resetExecutor,
    handlers: [() => {
      resetInvalidTabs();
    }],
  });

  useExecutor({
    executor: formContext?.onValidate,
    before: resetExecutor,
  });

  const value = useObjectRef(() => ({ validate, invalidTabs }), { invalidTabs, validate });

  return (
    <TabPanelValidationHandlerContext.Provider value={value}>
      {children}
    </TabPanelValidationHandlerContext.Provider>
  );
});