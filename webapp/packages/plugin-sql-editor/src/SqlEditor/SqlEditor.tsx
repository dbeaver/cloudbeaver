/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import { getComputed, preventFocusHandler, StaticImage, useSplit, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { BASE_TAB_STYLES, ITabData, TabList, TabPanelList, TabsState, VERTICAL_ROTATED_TAB_STYLES } from '@cloudbeaver/core-ui';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { useCaptureViewContext } from '@cloudbeaver/core-view';

import { ESqlDataSourceFeatures } from '../SqlDataSource/ESqlDataSourceFeatures';
import { ISqlEditorModeProps, SqlEditorModeService } from '../SqlEditorModeService';
import { DATA_CONTEXT_SQL_EDITOR_DATA } from './DATA_CONTEXT_SQL_EDITOR_DATA';
import type { ISqlEditorProps } from './ISqlEditorProps';
import { SqlEditorTools } from './SqlEditorTools';
import { useSqlEditor } from './useSqlEditor';

const styles = css`
    button, upload {
      composes: theme-ripple from global;
    }
    sql-editor {
      position: relative;
      z-index: 0;
      flex: 1 auto;
      height: 100%;
      display: flex;
      overflow: auto;
    }

    container {
      composes: theme-border-color-background from global;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: auto;
      border-right: solid 1px;
    }
  
    actions {
      width: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
      user-select: none;

      &:empty {
        display: none;
      }
    }
  
    button, upload {
      background: none;
      padding: 0;
      margin: 0;
      height: 32px;
      width: 32px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-shrink: 0;
    }
  
    StaticImage {
      height: 16px;
      width: 16px;
      cursor: pointer;
    }
  `;

const tabStyles = css`
  tabs {
    composes: theme-background-secondary theme-text-on-secondary from global;
    overflow-x: hidden;
  }
  Tab {
    composes: theme-ripple theme-background-background theme-text-text-primary-on-light theme-typography--body2 from global;
    text-transform: uppercase;
    font-weight: normal;

    &:global([aria-selected=true]) {
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
  const translate = useTranslate();
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
    state.currentModeId = tab.tabId;
  }

  const disabled = getComputed(() => data.isLineScriptEmpty || data.isDisabled);
  const isActiveSegmentMode = getComputed(() => data.activeSegmentMode.activeSegmentMode);
  const displayedEditors = getComputed(() => sqlEditorModeService.tabsContainer.getDisplayed({ state, data }).length);

  useEffect(() => {
    split.fixate('maximize', displayedEditors === 0);
  });

  const isScript = data.dataSource?.hasFeature(ESqlDataSourceFeatures.script);

  return styled(styles, BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES, tabStyles)(
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
        <container>
          <actions onMouseDown={preventFocusHandler}>
            {isScript && (
              <>
                <button
                  disabled={disabled}
                  title={translate('sql_editor_sql_execution_button_tooltip')}
                  onClick={data.executeQuery}
                >
                  <StaticImage icon="/icons/sql_exec.svg" />
                </button>
                <button
                  disabled={disabled}
                  title={translate('sql_editor_sql_execution_new_tab_button_tooltip')}
                  onClick={data.executeQueryNewTab}
                >
                  <StaticImage icon="/icons/sql_exec_new.svg" />
                </button>
                <button
                  disabled={disabled}
                  title={translate('sql_editor_sql_execution_script_button_tooltip')}
                  hidden={isActiveSegmentMode}
                  onClick={data.executeScript}
                >
                  <StaticImage icon="/icons/sql_script_exec.svg" />
                </button>
                {data.dialect?.supportsExplainExecutionPlan && (
                  <button
                    disabled={disabled}
                    title={translate('sql_editor_execution_plan_button_tooltip')}
                    onClick={data.showExecutionPlan}
                  >
                    <StaticImage icon="/icons/sql_execution_plan.svg" />
                  </button>
                )}
              </>
            )}
          </actions>
          <SqlEditorTools data={data} state={state} style={styles} />
        </container>
        <TabPanelList />
        {displayedEditors > 1 ? (
          <tabs>
            <TabList style={tabListStyles} />
          </tabs>
        ) : null}
      </sql-editor>
    </TabsState>
  );
});
