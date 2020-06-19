/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { PropsWithChildren } from 'react';
import styled, { css } from 'reshadow';

import { useTab } from '@cloudbeaver/core-app';
import { StaticImage } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';

import { CodeEditor } from './CodeEditor/CodeEditor';
import { SqlEditorController } from './SqlEditorController';

type SqlEditorProps = PropsWithChildren<{
  tabId: string;
  className?: string;
}>

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

  CodeEditor {
    flex: 1;
  }
`;

export const SqlEditor = observer(function SqlEditor({ tabId, className }: SqlEditorProps) {
  const tab = useTab(tabId);
  const controller = useController(SqlEditorController, tab);

  return styled(styles)(
    <sql-editor as="div" className={className}>
      <actions as="div">
        <button
          onClick={controller.handleExecute}
          disabled={controller.isActionsDisabled}>
          <StaticImage
            icon="/icons/sql_exec.png"
            title="Execute SQL Statement (Ctrl+Enter)"
          />
        </button>
        <button
          onClick={controller.handleExecuteNewTab}
          disabled={controller.isActionsDisabled}>
          <StaticImage
            icon="/icons/sql_exec_new.png"
            title="Execute SQL in new tab (Ctrl+\\)(Shift+Ctrl+Enter)"/>
        </button>
      </actions>
      <CodeEditor
        bindings={controller.bindings}
        dialect={controller.dialect}
        value={controller.value} />
    </sql-editor>
  );
});
