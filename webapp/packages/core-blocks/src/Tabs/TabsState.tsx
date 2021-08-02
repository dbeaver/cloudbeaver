/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useTabState } from 'reakit/Tab';

import { Executor, ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { MetadataMap, MetadataValueGetter } from '@cloudbeaver/core-utils';

import { useObjectRef } from '../useObjectRef';
import type { ITabData, ITabsContainer } from './TabsContainer/ITabsContainer';
import { TabsContext, ITabsContext } from './TabsContext';

type ExtractContainerProps<T> = T extends void ? Record<string, any> : T;

type Props<T = Record<string, any>> = ExtractContainerProps<T> & React.PropsWithChildren<{
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

export const TabsState = observer(function TabsState<T = Record<string, any>>({
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
  const props = rest as any as T;
  if (
    !selectedId
    && currentTabId === undefined
    && container
  ) {
    const displayed = container.getDisplayed(props);

    if (displayed.length > 0) {
      selectedId = displayed[0].key;
    }
  }

  const [localTabsState] = useState(() => new MetadataMap<string, any>());
  const tabsState = localState || localTabsState;
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
    props,
    tabsState,
    container,
    state,
    selectedId: selectedId || currentTabId,
  }, {
    open: onOpen,
    close: onClose,
    props,
    tabsState,
    container,
    state,
  });

  if (currentTabId !== undefined) {
    state.selectedId = currentTabId;
    dynamic.selectedId = currentTabId;
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
    if (currentTabId !== undefined) {
      return;
    }

    openExecutor.execute({
      tabId: state.selectedId!,
      props,
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
  const getTabState = useCallback(
    (tabId: string, valueGetter?: MetadataValueGetter<string, any>) => dynamic.container?.getTabState(
      dynamic.tabsState,
      tabId,
      dynamic.props,
      valueGetter
    ), []);

  const value = useMemo<ITabsContext<T>>(() => ({
    state,
    tabsState,
    props,
    container,
    openExecutor,
    closeExecutor,
    lazy,
    getTabInfo,
    getTabState,
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
    getTabState,
    handleClose,
    handleOpen,
  ]);

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
});
