/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TabProvider, useStoreState, useTabStore } from '@dbeaver/ui-kit';
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';

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
    /** Default selected tab id */
    selectedId?: string;
    orientation?: 'horizontal' | 'vertical';
    /** Provide a tab Id to control tabs state */
    currentTabId?: string | null;
    /**
     * When true, the selected tab is driven only by `currentTabId`.
     * Use it when tab switching is gated by an async,
     * cancellable action (e.g. a route guard) to sync with UI.
     */
    controlledSelection?: boolean;
    container?: ITabsContainer<T, any>;
    localState?: MetadataMap<string, any>;
    lazy?: boolean;
    autoSelect?: boolean;
    tabList?: string[];
    enabledBaseActions?: boolean;
    reorderStateKey?: string;
    sortFunction?: (tabs: string[]) => string[];
    canClose?: (tab: ITabData<T>) => boolean;
    onChange?: (tab: ITabData<T>) => void;
    onClose?: (tab: ITabData<T>) => void;
    onReorder?: (draggedTabId: string, targetTabId: string, position: 'before' | 'after') => void;
  }>;

export const TabsState = observer(function TabsState<T = Record<string, any>>({
  selectedId,
  orientation,
  currentTabId,
  controlledSelection,
  container,
  localState,
  children,
  lazy = false,
  autoSelect = true,
  tabList,
  enabledBaseActions,
  reorderStateKey,
  sortFunction,
  onChange: onOpen,
  onClose,
  canClose,
  onReorder,
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

  if (sortFunction) {
    displayed = sortFunction(displayed);
  }

  const closable = !!onClose;

  const [localTabsState] = useState(() => new MetadataMap<string, any>());
  const tabsState = localState || localTabsState;
  const [closeExecutor] = useState(() => new Executor<ITabData<T>>());
  const [openExecutor] = useState(() => new Executor<ITabData<T>>());

  const store = useTabStore({
    defaultSelectedId: selectedId ?? null,
    orientation,
    selectOnMove: false,
    focusLoop: false,
  });

  const selected = useStoreState(store, 'selectedId');

  const dynamic = useObjectRef(
    () => ({
      selectedId: selected,
    }),
    {
      canClose,
      open: onOpen,
      close: onClose,
      reorder: onReorder,
      props,
      tabsState,
      container,
      selected,
      store,
      tabList,
      controlledSelection,
    },
  );

  useEffect(() => {
    if (isNotNullDefined(currentTabId)) {
      dynamic.store.setSelectedId(currentTabId);
      dynamic.selectedId = currentTabId;
    }
  }, [currentTabId]);

  useLayoutEffect(() => {
    if (controlledSelection && isNotNullDefined(currentTabId) && selected !== currentTabId) {
      dynamic.store.setSelectedId(currentTabId);
      dynamic.selectedId = currentTabId;
    }
  }, [controlledSelection, currentTabId, selected]);

  useEffect(() => {
    if (displayed.length > 0 && autoSelect) {
      const selectedId = dynamic.store.getState().selectedId;
      const tabExists = isNotNullDefined(selectedId) && displayed.includes(selectedId);

      if (!tabExists) {
        dynamic.store.setSelectedId(displayed[0]);
      }
    }
  }, [displayed, autoSelect]);

  useExecutor({
    executor: openExecutor,
    handlers: [
      function openHandler(data, contexts) {
        dynamic.open?.(data);
        if (dynamic.selectedId === data.tabId) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
        if (dynamic.controlledSelection) {
          return;
        }
        dynamic.selectedId = data.tabId;
        if (dynamic.store.getState().selectedId !== data.tabId) {
          dynamic.store.setSelectedId(data.tabId);
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

  const currentSelectedId = selected;

  useEffect(() => {
    if (controlledSelection || !isNotNullDefined(currentSelectedId) || dynamic.selectedId === currentSelectedId) {
      return;
    }

    openExecutor.execute({
      tabId: currentSelectedId,
      props,
    });
  }, [currentSelectedId, controlledSelection]);

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
      getTabState(tabId: string, valueGetter?: MetadataValueGetter<string, any>, schema?: schema.ZodObject) {
        return dynamic.container?.getTabState(dynamic.tabsState, tabId, dynamic.props, valueGetter, schema);
      },
      setTabState(tabId: string, value: any) {
        return dynamic.container?.setTabState(dynamic.tabsState, tabId, value);
      },
      getLocalState(tabId: string, valueGetter?: MetadataValueGetter<string, any>, schema?: schema.ZodObject) {
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
      reorder(draggedTabId: string, targetTabId: string, position: 'before' | 'after') {
        dynamic.reorder?.(draggedTabId, targetTabId, position);
      },
      reorderStateKey,
      sortFunction,
    }),
    {
      tabsState: observable.ref,
      props: observable.ref,
      container: observable.ref,
      openExecutor: observable.ref,
      closeExecutor: observable.ref,
      lazy: observable.ref,
      closable: observable.ref,
      tabList: observable.ref,
      enabledBaseActions: observable.ref,
      reorderStateKey: observable.ref,
      sortFunction: observable.ref,
      getTabInfo: action.bound,
      getTabState: action.bound,
      getLocalState: action.bound,
      open: action.bound,
      close: action.bound,
      closeAll: action.bound,
      closeAllToTheDirection: action.bound,
      closeOthers: action.bound,
      reorder: action.bound,
    },
    {
      tabsState,
      props,
      container,
      openExecutor,
      closeExecutor,
      lazy,
      closable,
      tabList,
      enabledBaseActions,
      reorderStateKey,
      sortFunction,
    },
  );

  let currentTabInfo: ITabInfo<T, unknown> | undefined;

  if (container) {
    if (selected) {
      currentTabInfo = value.getTabInfo(selected);
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
    <TabProvider store={store}>
      <TabsContext.Provider value={value}>
        <TabsValidationProvider>{children}</TabsValidationProvider>
      </TabsContext.Provider>
    </TabProvider>
  );
});
