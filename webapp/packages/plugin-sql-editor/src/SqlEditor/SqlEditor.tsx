/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { PropsWithChildren, useEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import { useTab } from '@cloudbeaver/core-app';
import { StaticImage, useTab as useBaseTab } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';

import type { SQLCodeEditorController } from './SQLCodeEditor/SQLCodeEditorController';
import { SQLCodeEditorLoader } from './SQLCodeEditor/SQLCodeEditorLoader';
import { SqlEditorController } from './SqlEditorController';

type SqlEditorProps = PropsWithChildren<{
  tabId: string;
  className?: string;
}>;

const styles = css`
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
  }
  
  StaticImage {
    padding: 4px;
    height: 24px;
    width: 24px;
    cursor: pointer;
  }

  SQLCodeEditorLoader {
    flex: 1;
  }
`;

export const SqlEditor = observer(function SqlEditor({ tabId, className }: SqlEditorProps) {
  const tab = useTab(tabId);
  const editor = useRef<SQLCodeEditorController>(null);
  const baseTab = useBaseTab(tabId);
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

  return styled(styles)(
    <sql-editor className={className}>
      <actions>
        <button
          disabled={controller.isActionsDisabled}
          onMouseDown={preventFocus}
          onClick={controller.handleExecute}
        >
          <StaticImage
            icon="/icons/sql_exec.png"
            title="Execute SQL Statement (Ctrl + Enter)"
          />
        </button>
        <button
          disabled={controller.isActionsDisabled}
          onMouseDown={preventFocus}
          onClick={controller.handleExecuteNewTab}
        >
          <StaticImage
            icon="/icons/sql_exec_new.png"
            title="Execute SQL in new tab (Ctrl + \\)(Shift + Ctrl + Enter)"
          />
        </button>
        <button
          disabled={!controller.dialect?.supportsExplainExecutionPlan}
          onMouseDown={preventFocus}
          onClick={controller.handleExecutionPlan}
        >
          plan
        </button>
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
