/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { StaticImage, UploadArea } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { BASE_TAB_STYLES, TabList, TabPanelList, TabsState, VERTICAL_ROTATED_TAB_STYLES } from '@cloudbeaver/core-ui';

import { SqlEditorModeService } from '../SqlEditorModeService';
import type { ISqlEditorProps } from './ISqlEditorProps';
import { useSqlEditor } from './useSqlEditor';
import { useTools } from './useTools';

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
    }

    tools {
      width: 32px;
      display: flex;
      flex-direction: column;
      align-items: center;
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

    & tab-outer:only-child {
      display: none;
    }
  }
`;

export const SqlEditor = observer<ISqlEditorProps>(function SqlEditor({ state, className }) {
  const translate = useTranslate();
  const sqlEditorModeService = useService(SqlEditorModeService);
  const data = useSqlEditor(state);
  const tools = useTools(state);

  function preventFocus(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
  }

  async function handleScriptUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      throw new Error('File is not found');
    }

    const prevScript = data.value.trim();
    const script = await tools.tryReadScript(file, prevScript);

    if (script) {
      data.setQuery(script);
    }
  }

  const trimmedValue = data.value.trim();

  return styled(styles, BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES, tabStyles)(
    <TabsState
      currentTabId={state.currentEditorId}
      container={sqlEditorModeService.tabsContainer}
      state={state}
      data={data}
      onChange={tab => state.currentEditorId = tab.tabId}
    >
      <sql-editor className={className}>
        <container>
          <actions onMouseDown={preventFocus}>
            <button
              disabled={data.isLineScriptEmpty || data.isDisabled}
              title={translate('sql_editor_sql_execution_button_tooltip')}
              onClick={data.executeQuery}
            >
              <StaticImage icon="/icons/sql_exec.svg" />
            </button>
            <button
              disabled={data.isLineScriptEmpty || data.isDisabled}
              title={translate('sql_editor_sql_execution_new_tab_button_tooltip')}
              onClick={data.executeQueryNewTab}
            >
              <StaticImage icon="/icons/sql_exec_new.svg" />
            </button>
            <button
              disabled={data.isDisabled || data.isScriptEmpty}
              title={translate('sql_editor_sql_execution_script_button_tooltip')}
              onClick={data.executeScript}
            >
              <StaticImage icon="/icons/sql_script_exec.svg" />
            </button>
            {data.dialect?.supportsExplainExecutionPlan && (
              <button
                disabled={data.isLineScriptEmpty || data.isDisabled}
                title={translate('sql_editor_execution_plan_button_tooltip')}
                onClick={data.showExecutionPlan}
              >
                <StaticImage icon="/icons/sql_execution_plan.svg" />
              </button>
            )}
          </actions>
          <tools onMouseDown={preventFocus}>
            <button
              disabled={data.isDisabled || data.isScriptEmpty}
              title={translate('sql_editor_sql_format_button_tooltip')}
              onClick={data.formatScript}
            >
              <StaticImage icon="/icons/sql_format_sm.svg" />
            </button>
            <button
              disabled={!trimmedValue}
              title={translate('sql_editor_download_script_tooltip')}
              onClick={() => tools.downloadScript(trimmedValue)}
            >
              <StaticImage icon='/icons/save.svg' />
            </button>
            <UploadArea
              accept='.sql'
              title={translate('sql_editor_upload_script_tooltip')}
              reset
              onChange={handleScriptUpload}
            >
              <upload>
                <StaticImage icon='/icons/load.svg' />
              </upload>
            </UploadArea>
          </tools>
        </container>
        <TabPanelList />
        <tabs>
          <TabList style={[BASE_TAB_STYLES, VERTICAL_ROTATED_TAB_STYLES, tabStyles]} />
        </tabs>
      </sql-editor>
    </TabsState>
  );
});
