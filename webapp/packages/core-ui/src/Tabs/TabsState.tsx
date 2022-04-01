/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import { useTabState } from 'reakit/Tab';

import { useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { Executor, ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { MetadataMap, MetadataValueGetter } from '@cloudbeaver/core-utils';

import type { ITabData, ITabsContainer } from './TabsContainer/ITabsContainer';
import { TabsContext, ITabsContext } from './TabsContext';
import type { TabDirection } from './TabsContext';

type ExtractContainerProps<T> = T extends void ? Record<string, any> : T;

type Props<T = Record<string, any>> = ExtractContainerProps<T> & React.PropsWithChildren<{
  selectedId?: string;
  orientation?: 'horizontal' | 'vertical';
  currentTabId?: string | null;
  container?: ITabsContainer<T, any>;
  localState?: MetadataMap<string, any>;
  lazy?: boolean;
  manual?: boolean;
  tabList?: string[];
  enabledBaseActions?: boolean;
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
  tabList,
  enabledBaseActions,
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

  const closable = !!onClose;

  const [localTabsState] = useState(() => new MetadataMap<string, any>());
  const tabsState = localState || localTabsState;
  const [closeExecutor] = useState(() => new Executor<ITabData<T>>());
  const [openExecutor] = useState(() => new Executor<ITabData<T>>());

  const state = useTabState({
    selectedId: selectedId || currentTabId,
    orientation,
    manual,
  });

  const dynamic = useObjectRef(() => ({
    selectedId: selectedId || currentTabId,
  }), {
    open: onOpen,
    close: onClose,
    props,
    tabsState,
    container,
    state,
    tabList,
  });

  if (currentTabId !== undefined) {
    state.selectedId = currentTabId;
    dynamic.selectedId = currentTabId;
  }

  if (dynamic.container) {
    const displayed = dynamic.container.getDisplayed(props);
    const tabExists = displayed.some(tabInfo => tabInfo.key === dynamic.selectedId);

    if (displayed.length && !tabExists) {
      if (displayed.some(tabInfo => tabInfo.key === selectedId)) {
        state.selectedId = selectedId;
      } else {
        state.selectedId = displayed[0].key;
      }
    }
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

  useEffect(() => {
    if (state.selectedId) {
      openExecutor.execute({
        tabId: state.selectedId!,
        props,
      });
    }
  }, []);

  const value = useObservableRef<ITabsContext<T>>(() => ({
    getTabInfo(tabId: string) {
      return  dynamic.container?.getTabInfo(tabId);
    },
    getTabState(tabId: string, valueGetter?: MetadataValueGetter<string, any>) {
      return dynamic.container?.getTabState(
        dynamic.tabsState,
        tabId,
        dynamic.props,
        valueGetter
      );
    },
    getLocalState(tabId: string, valueGetter?: MetadataValueGetter<string, any>) {
      return dynamic.tabsState.get(
        tabId,
        valueGetter
      );
    },
    async open(tabId: string) {
      await openExecutor.execute({
        tabId,
        props: dynamic.props,
      });
    },
    async close(tabId: string) {
      await closeExecutor.execute({
        tabId,
        props: dynamic.props,
      });
    },
    async closeAll() {
      if (dynamic.tabList) {
        for (const tab of dynamic.tabList.slice()) {
          await this.close(tab);
        }
      }
    },
    async closeAllToTheDirection(tabId: string, direction: TabDirection) {
      if (dynamic.tabList) {
        const index = dynamic.tabList.indexOf(tabId);

        if (index === -1) {
          return;
        }

        const tabs = direction === 'left' ? dynamic.tabList.slice(0, index) : dynamic.tabList.slice(index + 1);

        for (const tab of tabs) {
          await this.close(tab);
        }
      }
    },
    async closeOthers(tabId: string) {
      if (dynamic.tabList) {
        const tabs = dynamic.tabList.filter(tab => tab !== tabId);
        for (const tab of tabs) {
          await this.close(tab);
        }
      }
    },
  }), {
    state: observable.ref,
    tabsState: observable.ref,
    props: observable.ref,
    container: observable.ref,
    openExecutor: observable.ref,
    closeExecutor: observable.ref,
    lazy: observable.ref,
    closable: observable.ref,
    tabList: observable.ref,
    enabledBaseActions: observable.ref,
    getTabInfo: action.bound,
    getTabState: action.bound,
    getLocalState: action.bound,
    open: action.bound,
    close: action.bound,
    closeAll: action.bound,
    closeAllToTheDirection: action.bound,
    closeOthers: action.bound,
  }, {
    state,
    tabsState,
    props,
    container,
    openExecutor,
    closeExecutor,
    lazy,
    closable,
    tabList,
    enabledBaseActions,
  });

  return (
    <TabsContext.Provider value={value}>
      {children}
    </TabsContext.Provider>
  );
});
