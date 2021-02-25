/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTabState } from 'reakit/Tab';

import { Executor, ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { useObjectRef } from '../useObjectRef';
import type { ITabData, ITabsContainer } from './TabsContainer/ITabsContainer';
import { TabsContext, ITabsContext } from './TabsContext';

type Props<T = Record<string, any>> = T & React.PropsWithChildren<{
  selectedId?: string;
  orientation?: 'horizontal' | 'vertical';
  currentTabId?: string | null;
  container?: ITabsContainer<T, any>;
  localState?: MetadataMap<string, any>;
  lazy?: boolean;
  manual?: boolean;
  onChange?: (tab: ITabData<T>) => void;
  onClose?: (tab: ITabData<T>) => void;
}>;

export function TabsState<T = Record<string, any>>({
  selectedId,
  orientation,
  currentTabId,
  container,
  localState,
  children,
  lazy = false,
  manual,
  onChange: onOpen,
  onClose,
  ...rest
}: Props<T>): React.ReactElement | null {
  if (
    !selectedId
    && !currentTabId
    && container
    && container.tabInfoList.length > 0
  ) {
    selectedId = container.tabInfoList[0].key;
  }

  // TODO: according react documentation fallback local state should be placed in another useState
  //       to avoid memory release from useMemo()
  const tabsState = useMemo(() => localState || new MetadataMap<string, any>(), [localState]);
  const [closeExecutor] = useState(() => new Executor<ITabData<T>>());
  const [openExecutor] = useState(() => new Executor<ITabData<T>>());

  const state = useTabState({
    selectedId: selectedId || currentTabId,
    orientation,
    manual,
  });

  const dynamic = useObjectRef({
    open: onOpen,
    close: onClose,
    props: rest as T,
    container,
    state,
    selectedId: selectedId || currentTabId,
  }, {
    open: onOpen,
    close: onClose,
    props: rest as T,
    container,
    state,
  });

  if (currentTabId) {
    state.selectedId = currentTabId;
  }

  useEffect(() => {
    const openHandler: IExecutorHandler<ITabData<T>> = (data, contexts) => {
      dynamic.open?.(data);
      if (dynamic.selectedId === data.tabId) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }
      dynamic.selectedId = data.tabId;
      dynamic.state.setSelectedId(data.tabId);
    };
    const closeHandler: IExecutorHandler<ITabData<T>> = data => dynamic.close?.(data);

    openExecutor.addHandler(openHandler);
    closeExecutor.addHandler(closeHandler);

    return () => {
      // probably not needed, executors destroyed with component
      openExecutor.removeHandler(openHandler);
      closeExecutor.removeHandler(closeHandler);
    };
  }, []);

  useEffect(() => {
    openExecutor.execute({
      tabId: state.selectedId!,
      props: rest as T,
    });
  }, [state.selectedId]);

  const handleOpen = useCallback((tabId: string) => openExecutor.execute({
    tabId,
    props: dynamic.props,
  }), []);

  const handleClose = useCallback((tabId: string) => closeExecutor.execute({
    tabId,
    props: dynamic.props,
  }), []);

  const getTabInfo = useCallback((tabId: string) => dynamic.container?.getTabInfo(tabId), []);

  const value = useMemo<ITabsContext<T>>(() => ({
    state,
    tabsState,
    props: rest as T,
    container,
    openExecutor,
    closeExecutor,
    lazy,
    getTabInfo,
    open: handleOpen,
    close: handleClose,
  }), [
    ...Object.values(state),
    tabsState,
    ...Object.values(rest),
    container,
    closeExecutor,
    openExecutor,
    lazy,
    getTabInfo,
    handleClose,
    handleOpen,
  ]);

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
}
