/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { useTabState } from 'reakit/Tab';

import { useExecutor, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { isNull, isUndefined, MetadataMap, MetadataValueGetter } from '@cloudbeaver/core-utils';

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
  autoSelect?: boolean;
  tabList?: string[];
  enabledBaseActions?: boolean;
  canClose?: (tab: ITabData<T>) => boolean;
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
  autoSelect = true,
  manual,
  tabList,
  enabledBaseActions,
  onChange: onOpen,
  onClose,
  canClose,
  ...rest
}: Props<T>): React.ReactElement | null {
  const props = useMemo(() => rest as any as T, [...Object.values(rest)]);
  let displayed: string[] = [];

  if (container) {
    displayed = container.getIdList(props);
  } else if (tabList) {
    displayed = tabList;
  }

  if (
    !selectedId
    && (currentTabId === undefined || currentTabId === null)
    && autoSelect
  ) {
    if (displayed.length > 0) {
      selectedId = displayed[0];
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
    canClose,
    open: onOpen,
    close: onClose,
    props,
    tabsState,
    container,
    state,
    tabList,
  });

  if (
    (
      !isNull(currentTabId)
      && !isUndefined(currentTabId)
    )
    || !autoSelect
  ) {
    state.selectedId = currentTabId;
    dynamic.selectedId = currentTabId;
  }

  if (
    displayed.length > 0
    && !isNull(dynamic.selectedId)
    && !isUndefined(dynamic.selectedId)
    && !isNull(selectedId)
    && !isUndefined(selectedId)
    && autoSelect
  ) {
    const tabExists = displayed.includes(dynamic.selectedId);

    if (!tabExists) {
      if (displayed.includes(selectedId)) {
        state.selectedId = selectedId;
      } else {
        state.selectedId = displayed[0];
      }
    }
  }

  useExecutor({
    executor: openExecutor,
    handlers: [function openHandler(data, contexts) {
      dynamic.open?.(data);
      if (dynamic.selectedId === data.tabId) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }
      dynamic.selectedId = data.tabId;
      dynamic.state.setSelectedId(data.tabId);
    }],
  });

  useExecutor({
    executor: closeExecutor,
    handlers: [function closeHandler(data) {
      dynamic.close?.(data);
    }],
  });

  useEffect(() => {
    if (
      (
        !isNull(currentTabId)
        && !isUndefined(currentTabId)
      )
      || !autoSelect
    ) {
      return;
    }

    openExecutor.execute({
      tabId: state.selectedId!,
      props,
    });
  }, [currentTabId, state.selectedId, autoSelect]);

  useEffect(() => {
    if (
      !isNull(state.selectedId)
      && !isUndefined(state.selectedId)
    ) {
      openExecutor.execute({
        tabId: state.selectedId,
        props,
      });
    }
  }, [!isNull(state.selectedId) && !isUndefined(state.selectedId)]);

  const value = useObservableRef<ITabsContext<T>>(() => ({
    canClose(tabId) {
      return dynamic.canClose?.({
        tabId,
        props: dynamic.props,
      }) ?? true;
    },
    getTabInfo(tabId: string) {
      return dynamic.container?.getTabInfo(tabId);
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
      if (!this.canClose(tabId)) {
        return;
      }

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
