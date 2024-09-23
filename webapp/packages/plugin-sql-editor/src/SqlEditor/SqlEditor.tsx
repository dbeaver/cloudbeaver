/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';

import { getComputed, s, SContext, type StyleRegistry, useS, useSplit } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, TabList, TabListStyles, TabPanelList, TabsState, TabStyles } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { type ISqlEditorModeProps, SqlEditorModeService } from '../SqlEditorModeService.js';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA.js';
import type { ISqlEditorProps } from './ISqlEditorProps.js';
import styles from './shared/SqlEditor.module.css';
import SqlEditorTab from './shared/SqlEditorTab.module.css';
import SqlEditorTabList from './shared/SqlEditorTabList.module.css';
import { SQLEditorActions } from './SQLEditorActions.js';
import { useSqlEditor } from './useSqlEditor.js';

const sqlEditorRegistry: StyleRegistry = [
  [TabListStyles, { mode: 'append', styles: [SqlEditorTabList] }],
  [TabStyles, { mode: 'append', styles: [SqlEditorTab] }],
];

export const SqlEditor = observer<ISqlEditorProps>(function SqlEditor({ state, className }) {
  const split = useSplit();
  const style = useS(styles, SqlEditorTab);
  const sqlEditorModeService = useService(SqlEditorModeService);
  const data = useSqlEditor(state);
  const [modesState] = useState(() => new MetadataMap<string, any>());

  useMemo(() => {
    modesState.sync(state.modeState);
  }, [state]);

  useCaptureViewContext((context, id) => {
    context.set(DATA_CONTEXT_SQL_EDITOR_DATA, data, id);
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
    <TabsState
      currentTabId={state.currentModeId}
      container={sqlEditorModeService.tabsContainer}
      localState={modesState}
      state={state}
      data={data}
      lazy
      onChange={handleModeSelect}
    >
      <SContext registry={sqlEditorRegistry}>
        <div className={s(style, { sqlEditor: true }, className)}>
          <SQLEditorActions data={data} state={state} />
          <TabPanelList />
          {displayedEditors > 1 ? (
            <div className={s(style, { tabs: true })}>
              <TabList vertical rotated />
            </div>
          ) : null}
        </div>
      </SContext>
    </TabsState>
  );
});
