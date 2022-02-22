/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { useContext } from 'react';

import { useExecutor, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
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
  const refObject = useObjectRef({ onClick });

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

  return useObservableRef(() => ({
    get selected() {
      return this.state.state.selectedId === this.tabId;
    },
    getInfo() {
      return this.state.getTabInfo(this.tabId);
    },
    handleOpen(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
      if (EventContext.has(e, EventStopPropagationFlag)) {
        return;
      }
      refObject.onClick?.(this.tabId);
      this.state.open(this.tabId);
    },
    handleClose(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
      EventContext.set(e, EventStopPropagationFlag); // TODO: probably should use special flag
      this.state.close(tabId);
    },
  }), {
    selected: computed,
    state: observable.ref,
    tabId: observable.ref,
  }, {
    state,
    tabId,
  }, ['getInfo', 'handleOpen', 'handleClose']);
}
