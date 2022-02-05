/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useState } from 'react';
import styled, { css } from 'reshadow';

import { StaticImage, UploadArea } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { ISqlEditorProps } from './ISqlEditorProps';
import type { SQLCodeEditorController } from './SQLCodeEditor/SQLCodeEditorController';
import { SQLCodeEditorLoader } from './SQLCodeEditor/SQLCodeEditorLoader';
import { SqlEditorController } from './SqlEditorController';
import { useTools } from './useTools';

const styles = composes(
  css`
    button, upload {
      composes: theme-ripple from global;
    }
  `,
  css`
    sql-editor {
      position: relative;
      z-index: 0;
      flex: 1 auto;
      height: 100%;
      display: flex;
      overflow: auto;
    }

    container {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
  
    actions {
      width: 32px;
      height: 100%;
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
    }
  
    StaticImage {
      height: 16px;
      width: 16px;
      cursor: pointer;
    }

    SQLCodeEditorLoader {
      flex: 1;
      overflow: auto;
    }
  `
);

export const SqlEditor = observer<ISqlEditorProps>(function SqlEditor({ state, className }) {
  const translate = useTranslate();
  const style = useStyles(styles);
  const [editor, setEditor] = useState<SQLCodeEditorController | null>(null);
  const controller = useController(SqlEditorController, state);
  const tools = useTools(state);

  useEffect(() => {
    editor?.focus();
  }, [editor]);

  function preventFocus(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
  }

  async function handleScriptUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      throw new Error('File is not found');
    }

    const prevScript = controller.value.trim();
    const script = await tools.tryReadScript(file, prevScript);

    if (script) {
      controller.setQuery(script);
    }
  }

  return styled(style)(
    <sql-editor className={className}>
      <container>
        <actions onMouseDown={preventFocus}>
          <button
            disabled={controller.isLineScriptEmpty || controller.isDisabled}
            title={translate('sql_editor_sql_execution_button_tooltip')}
            onClick={controller.executeQuery}
          >
            <StaticImage icon="/icons/sql_exec.svg" />
          </button>
          <button
            disabled={controller.isLineScriptEmpty || controller.isDisabled}
            title={translate('sql_editor_sql_execution_new_tab_button_tooltip')}
            onClick={controller.executeQueryNewTab}
          >
            <StaticImage icon="/icons/sql_exec_new.svg" />
          </button>
          <button
            disabled={controller.isDisabled || controller.isScriptEmpty}
            title={translate('sql_editor_sql_execution_script_button_tooltip')}
            onClick={controller.executeScript}
          >
            <StaticImage icon="/icons/sql_script_exec.svg" />
          </button>
          {controller.dialect?.supportsExplainExecutionPlan && (
            <button
              disabled={controller.isLineScriptEmpty || controller.isDisabled}
              title={translate('sql_editor_execution_plan_button_tooltip')}
              onClick={controller.showExecutionPlan}
            >
              <StaticImage icon="/icons/sql_execution_plan.svg" />
            </button>
          )}
        </actions>
        <tools onMouseDown={preventFocus}>
          <button
            disabled={controller.isDisabled || controller.isScriptEmpty}
            title={translate('sql_editor_sql_format_button_tooltip')}
            onClick={controller.formatScript}
          >
            <StaticImage icon="/icons/sql_format_sm.svg" />
          </button>
          <button
            disabled={!controller.value.trim()}
            title={translate('sql_editor_download_script_tooltip')}
            onClick={() => tools.downloadScript(controller.value.trim())}
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
      <SQLCodeEditorLoader
        ref={setEditor}
        readonly={controller.readonly}
        bindings={controller.bindings}
        dialect={controller.dialect}
        value={controller.value}
      />
    </sql-editor>
  );
});
