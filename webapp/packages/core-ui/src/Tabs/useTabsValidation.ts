/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useContext, useEffect, useRef } from 'react';

import { getComputed, useObjectRef } from '@cloudbeaver/core-blocks';

import { TabsContext } from './TabsContext';
import { TabsValidationContext } from './TabsValidationContext';

export function useTabsValidation(tabId: string): React.RefObject<HTMLDivElement> {
  const tabContextState = useContext(TabsContext);
  if (!tabContextState) {
    throw new Error('Tabs context was not provided');
  }

  const panelRef = useRef<HTMLDivElement>(null);
  const tabPanelValidationHandlerContext = useContext(TabsValidationContext);
  const selected = getComputed(() => tabContextState.state.selectedId === tabId);

  const tabPropsRef = useObjectRef({ tabId, tabPanelValidationHandlerContext });
  const validationState = useObjectRef(
    () => ({
      invalidElement: null as HTMLInputElement | null,
      invalidate(event: Event) {
        tabPropsRef.tabPanelValidationHandlerContext?.invalidate(tabPropsRef.tabId);

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

  return panelRef;
}
