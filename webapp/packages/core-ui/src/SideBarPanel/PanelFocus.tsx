/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect } from 'react';

import { useTabsState } from '../Tabs/useTabsState.js';
import { useTabsStore } from '../Tabs/useTabsStore.js';
import type { IPanelActivation } from './usePanelActivation.js';

export interface IPanelFocusProps {
  activation: IPanelActivation;
}

export const PanelFocus = observer<IPanelFocusProps>(function PanelFocus({ activation }) {
  const store = useTabsStore();
  const selectedId = useTabsState('selectedId');
  const renderedItems = useTabsState('renderedItems');
  const request = activation.request;

  useEffect(() => {
    if (request && selectedId === request.tabId && renderedItems.some(item => item.id === request.tabId && item.element)) {
      store.move(request.tabId);
      activation.completeRequest(request);
    }
  }, [activation, store, request, selectedId, renderedItems]);

  return null;
});
