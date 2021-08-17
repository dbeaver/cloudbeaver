/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import { StaticImage, useTab as useBaseTab } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { ISqlEditorProps } from './ISqlEditorProps';
import type { SQLCodeEditorController } from './SQLCodeEditor/SQLCodeEditorController';
import { SQLCodeEditorLoader } from './SQLCodeEditor/SQLCodeEditorLoader';
import { SqlEditorController } from './SqlEditorController';

const styles = composes(
  css`
    button {
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
  
    actions {
      width: 32px;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
  
    button {
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
      height: 20px;
      width: 20px;
      cursor: pointer;
    }

    SQLCodeEditorLoader {
      composes: custom-select from global;
      flex: 1;
      overflow: auto;
    }
  `
);

export const SqlEditor: React.FC<ISqlEditorProps> = observer(function SqlEditor({ tab, className }) {
  const translate = useTranslate();
  const style = useStyles(styles);
  const editor = useRef<SQLCodeEditorController>(null);
  const baseTab = useBaseTab(tab.id);
  const controller = useController(SqlEditorController, tab);

  useEffect(() => {
    if (!baseTab.selected) {
      return;
    }

    editor.current?.focus();
  }, [baseTab.selected]);

  if (!baseTab.selected) {
    return null;
  }

  function preventFocus(event: React.MouseEvent<HTMLButtonElement, MouseEvent>) {
    event.preventDefault();
  }

  return styled(style)(
    <sql-editor className={className}>
      <actions>
        <button
          disabled={controller.isLineScriptEmpty || controller.isDisabled}
          title={translate('sql_editor_sql_execution_button_tooltip')}
          onMouseDown={preventFocus}
          onClick={controller.executeQuery}
        >
          <StaticImage icon="/icons/sql_exec.svg" />
        </button>
        <button
          disabled={controller.isLineScriptEmpty || controller.isDisabled}
          title={translate('sql_editor_sql_execution_new_tab_button_tooltip')}
          onMouseDown={preventFocus}
          onClick={controller.executeQueryNewTab}
        >
          <StaticImage icon="/icons/sql_exec_new.svg" />
        </button>
        <button
          disabled={controller.isDisabled || controller.isScriptEmpty}
          title={translate('sql_editor_sql_execution_script_button_tooltip')}
          onMouseDown={preventFocus}
          onClick={controller.executeScript}
        >
          <StaticImage icon="/icons/sql_script_exec.svg" />
        </button>
        {controller.dialect?.supportsExplainExecutionPlan && (
          <button
            disabled={controller.isLineScriptEmpty || controller.isDisabled}
            title={translate('sql_editor_execution_plan_button_tooltip')}
            onMouseDown={preventFocus}
            onClick={controller.showExecutionPlan}
          >
            <StaticImage icon="/icons/sql_execution_plan.svg" />
          </button>
        )}
      </actions>
      <SQLCodeEditorLoader
        ref={editor}
        readonly={controller.readonly}
        bindings={controller.bindings}
        dialect={controller.dialect}
        value={controller.value}
      />
    </sql-editor>
  );
});
