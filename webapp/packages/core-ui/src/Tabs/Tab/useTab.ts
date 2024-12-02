/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, observable } from 'mobx';
import { useContext } from 'react';

import { useExecutor, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';

import { TabContext } from '../TabContext.js';
import type { ITabData } from '../TabsContainer/ITabsContainer.js';
import { TabsContext } from '../TabsContext.js';

export function useTab(
  tabId?: string,
  onOpen?: (tab: ITabData<any>) => Promise<void> | void,
  onClose?: (tab: ITabData<any>) => Promise<void> | void,
  onClick?: (tabId: string) => void,
) {
  const state = useContext(TabsContext);
  const tabContext = useContext(TabContext);
  const refObject = useObjectRef({ onClick });

  tabId = tabId || tabContext?.tabId;

  if (tabId === undefined) {
    throw new Error('Tab id not provided');
  }

  if (!state) {
    throw new Error('TabsContext not provided');
  }

  useExecutor({
    executor: state.openExecutor,
    handlers: [
      async function openHandler(data) {
        if (tabId !== data.tabId) {
          return;
        }
        await onOpen?.(data);
      },
    ],
  });

  useExecutor({
    executor: state.closeExecutor,
    handlers: [
      async function closeHandler(data) {
        if (tabId !== data.tabId) {
          return;
        }
        await onClose?.(data);
      },
    ],
  });

  return useObservableRef(
    () => ({
      get selected() {
        return this.state.state.selectedId === this.tabId;
      },
      get closable() {
        return this.state.canClose(this.tabId);
      },
      getInfo() {
        return this.state.getTabInfo(this.tabId);
      },
      handleOpen(e: React.MouseEvent<HTMLButtonElement>) {
        if (EventContext.has(e, EventStopPropagationFlag)) {
          return;
        }
        refObject.onClick?.(this.tabId);
        this.state.open(this.tabId);
      },
      handleClose(e: React.MouseEvent<HTMLDivElement>) {
        EventContext.set(e, EventStopPropagationFlag); // TODO: probably should use special flag
        this.state.close(this.tabId);
      },
    }),
    {
      selected: computed,
      closable: computed,
      state: observable.ref,
      tabId: observable.ref,
    },
    {
      state,
      tabId,
    },
    ['getInfo', 'handleOpen', 'handleClose'],
  );
}
