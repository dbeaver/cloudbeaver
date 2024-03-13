/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';

import { getComputed, s, SContext, StyleRegistry, useS, useSplit } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import {
  ITabData,
  TabIconStyles,
  TabList,
  TabListStyles,
  TabPanelList,
  TabsState,
  TabStyles,
  TabTitleStyles,
  TabVerticalRotatedStyles,
} from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { ISqlEditorModeProps, SqlEditorModeService } from '../../SqlEditorModeService';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from '../DATA_CONTEXT_SQL_EDITOR_DATA';
import type { ISqlEditorProps } from '../ISqlEditorProps';
import { SQLEditorActions } from '../SQLEditorActions';
import { useSqlEditor } from '../useSqlEditor';
import styles from './styles/SqlEditor.m.css';
import SqlEditorTab from './styles/SqlEditorTab.m.css';
import SqlEditorTabList from './styles/SqlEditorTabList.m.css';

const sqlEditorRegistry: StyleRegistry = [
  [TabListStyles, { mode: 'append', styles: [TabVerticalRotatedStyles, SqlEditorTabList] }],
  [TabStyles, { mode: 'append', styles: [TabVerticalRotatedStyles, SqlEditorTab] }],
  [
    TabIconStyles,
    {
      mode: 'append',
      styles: [TabVerticalRotatedStyles],
    },
  ],
  [
    TabTitleStyles,
    {
      mode: 'append',
      styles: [TabVerticalRotatedStyles],
    },
  ],
];

export const SqlEditor = observer<ISqlEditorProps>(function SqlEditor({ state, className }) {
  const split = useSplit();
  const style = useS(styles);
  const sqlEditorModeService = useService(SqlEditorModeService);
  const data = useSqlEditor(state);
  const [modesState] = useState(() => new MetadataMap<string, any>());

  useMemo(() => {
    modesState.sync(state.modeState);
  }, [state]);

  useCaptureViewContext(context => {
    context?.set(DATA_CONTEXT_SQL_EDITOR_DATA, data);
  });

  function handleModeSelect(tab: ITabData<ISqlEditorModeProps>) {
    data.setModeId(tab.tabId);
  }

  const displayedEditors = getComputed(() => sqlEditorModeService.tabsContainer.getDisplayed({ state, data }).length);
  const isEditorEmpty = displayedEditors === 0;

  useEffect(() => {
    if (isEditorEmpty) {
      split.state.setDisable(true);
    } else if (split.state.disable) {
      split.state.setDisable(false);
    }
  }, [isEditorEmpty]);

  return (
    <SContext registry={sqlEditorRegistry}>
      <TabsState
        currentTabId={state.currentModeId}
        container={sqlEditorModeService.tabsContainer}
        localState={modesState}
        state={state}
        data={data}
        lazy
        onChange={handleModeSelect}
      >
        <div className={s(style, { sqlEditor: true }, className)}>
          <SQLEditorActions data={data} state={state} />
          <TabPanelList />
          {displayedEditors > 1 ? (
            <div className={s(style, { tabs: true })}>
              <TabList />
            </div>
          ) : null}
        </div>
      </TabsState>
    </SContext>
  );
});
