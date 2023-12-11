import { observer } from 'mobx-react-lite';
import { useContext, useEffect, useRef, useState } from 'react';
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

  function addInvalidTab(tabId: string) {
    invalidTabs.current.add(tabId);
  };

  function resetInvalidTabs() {
    invalidTabs.current = new Set();
  }

  useExecutor({
    executor: resetExecutor,
    handlers: [resetInvalidTabs],
  });

  useExecutor({
    executor: formContext?.onValidate,
    before: resetExecutor,
  });

  useExecutor({
    executor: formContext?.onValidate,
    postHandlers: [() => formContext?.reportValidity()],
  });

  useEffect(() => {
    async function goNextTab() {
      const firstInvalidTab = invalidTabs.current.values().next().value;
  
      if (
        (selectedTab && invalidTabs.current.has(selectedTab)) || 
        invalidTabs.current.size === 0 ||
        !firstInvalidTab
      ) {
        return;
      }
  
      await state?.open(firstInvalidTab);
      resetInvalidTabs();
    }

    if (formContext === null) {
      return;
    }

    formContext?.parent?.ref?.removeEventListener('invalid', goNextTab, true);
    formContext?.parent?.ref?.addEventListener('invalid', goNextTab, true);

    return () => {
      formContext?.parent?.ref?.removeEventListener('invalid', goNextTab, true);
    };
  }, [selectedTab, state, formContext]);

  const value = useObjectRef(() => ({ addInvalidTab, invalidTabs }), { invalidTabs });

  return (
    <TabPanelValidationHandlerContext.Provider value={value}>
      {children}
    </TabPanelValidationHandlerContext.Provider>
  );
});