/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useTabState } from 'reakit/Tab';

import { Executor, IExecutorHandler } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { TabsContainer } from './TabsContainer';
import { TabsContext, ITabsContext, ITabData } from './TabsContext';

type Props<T = Record<string, any>> = T & React.PropsWithChildren<{
  selectedId?: string;
  orientation?: 'horizontal' | 'vertical';
  currentTabId?: string | null;
  container?: TabsContainer<T>;
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

  const tabsState = useMemo(() => localState || new MetadataMap<string, any>(), [localState]);
  const [closeExecutor] = useState(() => new Executor<ITabData<T>>());
  const [openExecutor] = useState(() => new Executor<ITabData<T>>());

  const state = useTabState({
    selectedId: selectedId || currentTabId,
    orientation,
    manual,
  });

  const dynamic = useRef({
    open: onOpen,
    close: onClose,
    props: rest as T,
    selectedId: selectedId || currentTabId,
    state,
  });

  dynamic.current.open = onOpen;
  dynamic.current.close = onClose;
  dynamic.current.props = rest as T;
  dynamic.current.state = state;

  if (currentTabId) {
    state.selectedId = currentTabId;
  }

  useEffect(() => {
    const openHandler: IExecutorHandler<ITabData<T>> = data => {
      dynamic.current.open?.(data);
      if (dynamic.current.selectedId === data.tabId) {
        return false;
      }
      dynamic.current.selectedId = data.tabId;
      dynamic.current.state.select(data.tabId);
      return undefined;
    };
    const closeHandler: IExecutorHandler<ITabData<T>> = data => dynamic.current.close?.(data);

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
    props: dynamic.current.props,
  }), [openExecutor]);

  const handleClose = useCallback((tabId: string) => closeExecutor.execute({
    tabId,
    props: dynamic.current.props,
  }), [closeExecutor]);

  const value = useMemo<ITabsContext<T>>(() => ({
    state,
    tabsState,
    props: rest as T,
    container,
    openExecutor,
    closeExecutor,
    lazy,
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
    handleClose,
    handleOpen,
  ]);

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
}
