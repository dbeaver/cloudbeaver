/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import { useTabState } from 'reakit';

import { useAutoLoad, useExecutor, useObjectRef, useObservableRef } from '@cloudbeaver/core-blocks';
import { useDataContext } from '@cloudbeaver/core-data-context';
import { Executor, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { MetadataMap, type MetadataValueGetter, schema } from '@cloudbeaver/core-utils';
import { isDefined, isNotNullDefined } from '@dbeaver/js-helpers';

import type { ITabData, ITabInfo, ITabsContainer } from './TabsContainer/ITabsContainer.js';
import { type ITabsContext, type TabDirection, TabsContext } from './TabsContext.js';
import { TabsValidationProvider } from './TabsValidationProvider.js';

type ExtractContainerProps<T> = T extends void ? Record<string, any> : T;

export type TabsStateProps<T = Record<string, any>> = ExtractContainerProps<T> &
  React.PropsWithChildren<{
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
}: TabsStateProps<T>): React.ReactElement | null {
  const context = useDataContext();
  const props = useMemo(() => rest as any as T, [...Object.values(rest)]);
  let displayed: string[] = [];

  if (container) {
    displayed = container.getIdList(props);
  } else if (tabList) {
    displayed = tabList;
  }

  const closable = !!onClose;

  const [localTabsState] = useState(() => new MetadataMap<string, any>());
  const tabsState = localState || localTabsState;
  const [closeExecutor] = useState(() => new Executor<ITabData<T>>());
  const [openExecutor] = useState(() => new Executor<ITabData<T>>());

  const state = useTabState({
    selectedId: selectedId || currentTabId || container?.selectedId || null,
    orientation,
    manual,
  });

  const dynamic = useObjectRef(
    () => ({
      selectedId: state.selectedId,
    }),
    {
      canClose,
      open: onOpen,
      close: onClose,
      props,
      tabsState,
      container,
      state,
      tabList,
    },
  );

  if (isNotNullDefined(currentTabId)) {
    state.selectedId = currentTabId;
  }

  if (displayed.length > 0 && autoSelect) {
    const tabExists = isNotNullDefined(state.selectedId) && displayed.includes(state.selectedId);

    if (!tabExists) {
      state.selectedId = displayed[0];
    }
  }

  if (isNotNullDefined(currentTabId)) {
    dynamic.selectedId = state.selectedId;
  }

  useExecutor({
    executor: openExecutor,
    handlers: [
      function openHandler(data, contexts) {
        dynamic.open?.(data);
        if (dynamic.selectedId === data.tabId) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
        dynamic.selectedId = data.tabId;
        if (dynamic.state.selectedId !== data.tabId) {
          dynamic.state.setCurrentId(data.tabId);
          dynamic.state.setSelectedId(data.tabId);
        }
      },
    ],
  });

  useExecutor({
    executor: closeExecutor,
    handlers: [
      function closeHandler(data) {
        dynamic.close?.(data);
      },
    ],
  });

  const currentSelectedId = state.selectedId;

  useEffect(() => {
    if (!isNotNullDefined(currentSelectedId) || dynamic.selectedId === currentSelectedId) {
      return;
    }

    openExecutor.execute({
      tabId: currentSelectedId,
      props,
    });
  }, [currentSelectedId]);

  const value = useObservableRef<ITabsContext<T>>(
    () => ({
      context,
      canClose(tabId) {
        return (
          dynamic.canClose?.({
            tabId,
            props: dynamic.props,
          }) ?? true
        );
      },
      getTabInfo(tabId: string) {
        return dynamic.container?.getDisplayedTabInfo(tabId, dynamic.props);
      },
      getTabState(tabId: string, valueGetter?: MetadataValueGetter<string, any>, schema?: schema.AnyZodObject) {
        return dynamic.container?.getTabState(dynamic.tabsState, tabId, dynamic.props, valueGetter, schema);
      },
      getLocalState(tabId: string, valueGetter?: MetadataValueGetter<string, any>, schema?: schema.AnyZodObject) {
        return dynamic.tabsState.get(tabId, valueGetter, schema);
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
    }),
    {
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
    },
    {
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
    },
  );

  let currentTabInfo: ITabInfo<T, unknown> | undefined;
  if (container) {
    if (state.selectedId) {
      currentTabInfo = value.getTabInfo(state.selectedId);
    }
  }

  useAutoLoad(
    TabsState,
    container?.tabInfoList
      .map(tab => tab.getLoader?.(context, props))
      .filter(isDefined)
      .flat() || [],
    !!container,
  );

  useAutoLoad(
    TabsState,
    [currentTabInfo?.getLoader?.(context, props) || []].flat().filter(loader => loader.lazy),
    !!container,
    true,
  );

  return (
    <TabsContext.Provider value={value}>
      <TabsValidationProvider>{children}</TabsValidationProvider>
    </TabsContext.Provider>
  );
});
