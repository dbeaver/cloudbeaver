/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, runInAction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useContext, useState } from 'react';

import { useExecutor, useObservableRef } from '@cloudbeaver/core-blocks';
import { ExecutorHandlersCollection, ExecutorInterrupter } from '@cloudbeaver/core-executor';
import { type ITabData, type ITabsContainer, TabList, TabsContext, useTabsState, useTabsStore } from '@cloudbeaver/core-ui';

import type { ISqlEditorModeOptions, ISqlEditorModeProps } from '../SqlEditorModeService.js';
import { requestSqlEditorFocus } from '../SqlEditorModel/requestSqlEditorFocus.js';
import type { ISQLEditorData } from './ISQLEditorData.js';

interface Props {
  data: ISQLEditorData;
  container: ITabsContainer<ISqlEditorModeProps, ISqlEditorModeOptions>;
}

interface ISuppressedMove {
  store: ReturnType<typeof useTabsStore>;
  moves: number;
}

function modeSelectionContext(): { explicit: boolean } {
  return { explicit: false };
}

export const SqlEditorModeTabList = observer<Props>(function SqlEditorModeTabList({ data, container }) {
  const context = useContext(TabsContext);
  const store = useTabsStore();
  const moves = useTabsState('moves');
  const [beforeSelection] = useState(() => new ExecutorHandlersCollection<ITabData<ISqlEditorModeProps>>());

  if (!context) {
    throw new Error('Tabs context was not provided');
  }

  const state = useObservableRef(
    () => ({
      suppressedMove: null as ISuppressedMove | null,
      suppressCurrentMove() {
        this.suppressedMove = { store: this.store, moves: this.store.getState().moves };
      },
    }),
    { suppressedMove: observable.ref, suppressCurrentMove: action.bound },
    { data, context, store, container },
  );

  useExecutor({
    executor: beforeSelection,
    handlers: [
      (tab, contexts) => {
        const currentModeId = state.data.state.currentModeId;
        contexts.getContext(modeSelectionContext).explicit =
          currentModeId !== undefined && currentModeId !== tab.tabId && state.container.getIdList(state.context.props).includes(currentModeId);
      },
    ],
  });

  useExecutor({
    executor: context.openExecutor,
    before: beforeSelection,
    postHandlers: [
      (tab, contexts) => {
        if (!contexts.getContext(modeSelectionContext).explicit || ExecutorInterrupter.isInterrupted(contexts)) {
          return;
        }

        if (!state.container.getDisplayedTabInfo(tab.tabId, state.context.props)?.options?.focusPanelOnSelect) {
          return;
        }

        runInAction(() => {
          state.suppressCurrentMove();
          const model = state.data.model;
          requestSqlEditorFocus(
            model,
            () => state.data.model === model && state.data.state.currentModeId === tab.tabId,
            () => state.store.getState().renderedItems.find(item => item.id === tab.tabId)?.element ?? null,
          );
        });
      },
    ],
  });

  const focusOnMove = state.suppressedMove?.store !== store || state.suppressedMove.moves !== moves;

  return <TabList focusOnMove={focusOnMove} vertical rotated />;
});
