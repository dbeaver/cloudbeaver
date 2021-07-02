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

import { Icon, StaticImage, useTab as useBaseTab } from '@cloudbeaver/core-blocks';
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
      cursor: pointer;
    }
  
    StaticImage, Icon {
      padding: 4px;
      height: 24px;
      width: 24px;
      cursor: pointer;
    }

    SQLCodeEditorLoader {
      flex: 1;
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
          disabled={controller.isActionsDisabled}
          title={translate('sql_editor_sql_execution_button_tooltip')}
          onMouseDown={preventFocus}
          onClick={controller.handleExecute}
        >
          <StaticImage icon="/icons/sql_exec.png" />
        </button>
        <button
          disabled={controller.isActionsDisabled}
          title={translate('sql_editor_sql_execution_new_tab_button_tooltip')}
          onMouseDown={preventFocus}
          onClick={controller.handleExecuteNewTab}
        >
          <StaticImage icon="/icons/sql_exec_new.png" />
        </button>
        {controller.dialect?.supportsExplainExecutionPlan && (
          <button
            disabled={controller.isActionsDisabled}
            title={translate('sql_editor_execution_plan_button_tooltip')}
            onMouseDown={preventFocus}
            onClick={controller.handleExecutionPlan}
          >
            <Icon name="execution-plan" viewBox='0 0 24 24' />
          </button>
        )}
      </actions>
      <SQLCodeEditorLoader
        ref={editor}
        bindings={controller.bindings}
        dialect={controller.dialect}
        value={controller.value}
      />
    </sql-editor>
  );
});
