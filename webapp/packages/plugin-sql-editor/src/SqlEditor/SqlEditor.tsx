/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { PropsWithChildren, useLayoutEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import { useTab } from '@cloudbeaver/core-app';
import { StaticImage, useTab as useBaseTab } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';

import { CodeEditor } from './CodeEditor/CodeEditor';
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

  CodeEditor {
    flex: 1;
  }
`;

export const SqlEditor: React.FC<SqlEditorProps> = observer(function SqlEditor({ tabId, className }) {
  const codeEditorRef = useRef<HTMLDivElement | null>(null);
  const tab = useTab(tabId);
  const baseTab = useBaseTab(tabId);
  const controller = useController(SqlEditorController, tab);

  useLayoutEffect(() => {
    if (codeEditorRef.current) {
      controller.codeEditorRef = codeEditorRef.current;
    }
  });

  if (!baseTab.selected) {
    return null;
  }

  return styled(styles)(
    <sql-editor as="div" className={className}>
      <actions as="div">
        <button
          disabled={controller.isActionsDisabled}
          onClick={controller.handleExecute}
        >
          <StaticImage
            icon="/icons/sql_exec.png"
            title="Execute SQL Statement (Ctrl+Enter)"
          />
        </button>
        <button
          disabled={controller.isActionsDisabled}
          onClick={controller.handleExecuteNewTab}
        >
          <StaticImage
            icon="/icons/sql_exec_new.png"
            title="Execute SQL in new tab (Ctrl+\\)(Shift+Ctrl+Enter)"
          />
        </button>
      </actions>
      <CodeEditor
        ref={codeEditorRef}
        bindings={controller.bindings}
        dialect={controller.dialect}
        value={controller.value}
      />
    </sql-editor>
  );
});
