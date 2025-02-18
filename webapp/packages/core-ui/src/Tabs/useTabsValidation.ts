/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useRef } from 'react';

import { FormContext, getComputed, useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { ExecutorHandlersCollection } from '@cloudbeaver/core-executor';

import { TabsContext } from './TabsContext.js';
import { TabsValidationContext } from './TabsValidationContext.js';

export function useTabsValidation(tabId: string): React.RefObject<HTMLDivElement | null> {
  const tabContextState = useContext(TabsContext);
  const formContext = useContext(FormContext);

  if (!tabContextState) {
    throw new Error('Tabs context was not provided');
  }

  const panelRef = useRef<HTMLDivElement>(null);
  const tabsValidationContext = useContext(TabsValidationContext);
  const selected = getComputed(() => tabContextState.state.selectedId === tabId);

  const tabPropsRef = useObjectRef({ tabId, tabsValidationContext });
  const validationState = useObjectRef(
    () => ({
      beforeValidationCollection: new ExecutorHandlersCollection(),
      invalidElement: null as HTMLInputElement | null,
      invalidate(event: Event) {
        tabPropsRef.tabsValidationContext?.invalidate(tabPropsRef.tabId);

        // we want to store only first element in order in the form
        if (this.invalidElement === null) {
          this.invalidElement = event.target as HTMLInputElement | null;
        }
      },
      reportValidity() {
        if (this.invalidElement) {
          this.invalidElement.reportValidity();
          this.reset();
        }
      },
      reset() {
        this.invalidElement = null;
      },
    }),
    false,
    ['invalidate'],
  );

  useEffect(() => {
    const element = panelRef.current;

    if (!element) {
      return;
    }

    element.addEventListener('invalid', validationState.invalidate, true);
    return () => {
      element.removeEventListener('invalid', validationState.invalidate, true);
    };
  });

  useEffect(() => {
    if (selected) {
      validationState.reportValidity();
    }
  }, [selected]);

  useExecutor({
    executor: formContext?.onValidate,
    before: validationState.beforeValidationCollection,
  });

  useExecutor({
    executor: validationState.beforeValidationCollection,
    handlers: [
      () => {
        validationState.reset();
      },
    ],
  });

  return panelRef;
}
