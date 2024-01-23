/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import { getComputed, useSplit } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, ITabData, TabList, TabPanelList, TabsState, VERTICAL_ROTATED_TAB_STYLES } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { ISqlEditorModeProps, SqlEditorModeService } from '../SqlEditorModeService';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA';
import type { ISqlEditorProps } from './ISqlEditorProps';
import { SQLEditorActions } from './SQLEditorActions';
import { useSqlEditor } from './useSqlEditor';

const styles = css`
  sql-editor {
    position: relative;
    z-index: 0;
    flex: 1 auto;
    height: 100%;
    display: flex;
    overflow: auto;
  }
`;

const tabStyles = css`
  tabs {
    composes: theme-background-secondary theme-text-on-secondary from global;
    overflow-x: hidden;
    padding-top: 4px;
  }
  Tab {
    composes: theme-ripple theme-background-background theme-text-text-primary-on-light theme-typography--body2 from global;
    text-transform: uppercase;
    font-weight: normal;

    &:global([aria-selected='true']) {
      font-weight: normal !important;
    }
  }
  TabList {
    composes: theme-background-secondary theme-text-on-secondary from global;
    margin-right: 8px;
    margin-left: 4px;
  }
`;

const tabListStyles = [BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES, tabStyles];

export const SqlEditor = observer<ISqlEditorProps>(function SqlEditor({ state, className }) {
  const split = useSplit();
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

  useEffect(() => {
    if (displayedEditors === 0) {
      split.fixate('maximize', true);
    } else if (split.state.disable) {
      split.fixate('resize', false);
      split.state.setSize(-1);
    }
  }, [displayedEditors]);

  return styled(
    styles,
    BASE_TAB_STYLES,
    VERTICAL_ROTATED_TAB_STYLES,
    tabStyles,
  )(
    <TabsState
      currentTabId={state.currentModeId}
      container={sqlEditorModeService.tabsContainer}
      localState={modesState}
      state={state}
      data={data}
      lazy
      onChange={handleModeSelect}
    >
      <sql-editor className={className}>
        <SQLEditorActions data={data} state={state} />
        <TabPanelList />
        {displayedEditors > 1 ? (
          <tabs>
            <TabList style={tabListStyles} />
          </tabs>
        ) : null}
      </sql-editor>
    </TabsState>,
  );
});
