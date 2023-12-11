import { observer } from 'mobx-react-lite';
import { useCallback, useContext, useRef, useState } from 'react';
import { TabsContext } from './TabsContext';
import { FormContext, useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { TabPanelValidationHandlerContext } from './TabPanelValidationHandlerContext';
import { SyncExecutor } from '@cloudbeaver/core-executor';

export interface ITabPanelHandlerProps {
  children: React.ReactNode;
}

export const TabPanelValidationHandler = observer(function TabPanelValidationHandler({ children }: ITabPanelHandlerProps) {
  const state = useContext(TabsContext);
  const formContext = useContext(FormContext);
  const selectedTab = state?.state.selectedId;
  const invalidTabs = useRef<Set<string>>(new Set());
  const [resetExecutor] = useState(() => new SyncExecutor());

  if (!state) {
    throw new Error('TabsState should be defined');
  }

  function resetInvalidTabs() {
    invalidTabs.current = new Set();
  }

  const validate = useCallback((tabId: string) => {
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

      state.open(next);
    }, 0);
  }, [selectedTab, state]);

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