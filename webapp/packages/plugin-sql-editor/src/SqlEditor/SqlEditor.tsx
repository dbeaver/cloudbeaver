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
import { baseTabStyles, ITabData, TabList, TabPanelList, TabsState, verticalRotatedTabStyles } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { ISqlEditorModeProps, SqlEditorModeService } from '../SqlEditorModeService';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA';
import type { ISqlEditorProps } from './ISqlEditorProps';
import styles from './SqlEditor.m.css';
import { SQLEditorActions } from './SQLEditorActions';
import { useSqlEditor } from './useSqlEditor';

const sqlEditorRegistry: StyleRegistry = [[baseTabStyles, { mode: 'append', styles: [verticalRotatedTabStyles, styles] }]];

export const SqlEditor = observer<ISqlEditorProps>(function SqlEditor({ state, className }) {
  const split = useSplit();
  const style = useS(baseTabStyles, verticalRotatedTabStyles, styles);
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
              <TabList className={s(style, { tabList: true })} />
            </div>
          ) : null}
        </div>
      </TabsState>
    </SContext>
  );
});
