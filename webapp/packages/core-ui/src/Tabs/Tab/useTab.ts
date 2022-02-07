/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useContext } from 'react';

import { useExecutor, useObjectRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import type { ITabData } from '../TabsContainer/ITabsContainer';
import { TabsContext } from '../TabsContext';

export function useTab(
  tabId: string,
  onOpen?: (tab: ITabData<any>) => Promise<void> | void,
  onClose?: (tab: ITabData<any>) => Promise<void> | void,
  onClick?: (tabId: string) => void,
) {
  const state = useContext(TabsContext);
  if (!state) {
    throw new Error('TabsContext not provided');
  }

  useExecutor({
    executor: state.openExecutor,
    handlers: [async function openHandler(data) {
      if (tabId !== data.tabId) {
        return;
      }
      await onOpen?.(data);
    }],
  });

  useExecutor({
    executor: state.closeExecutor,
    handlers: [async function closeHandler(data) {
      if (tabId !== data.tabId) {
        return;
      }
      await onClose?.(data);
    }],
  });

  return useObjectRef({
    state,
    getInfo: () => state.getTabInfo(tabId),
    selected: state.state.selectedId === tabId,
    handleOpen: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
      if (EventContext.has(e, EventStopPropagationFlag)) {
        return;
      }
      onClick?.(tabId);
      state.open(tabId);
    },
    handleClose: (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      EventContext.set(e, EventStopPropagationFlag); // TODO: probably should use special flag
      state.close(tabId);
    },
  });
}
