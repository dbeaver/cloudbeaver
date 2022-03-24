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

import { DATA_CONTEXT_NAV_NODE, NavNodeManagerService } from '@cloudbeaver/core-app';
import { useService } from '@cloudbeaver/core-di';
import { TabContainerPanelComponent, useDNDBox } from '@cloudbeaver/core-ui';

import type { ISqlEditorModeProps } from '../../SqlEditorModeService';
import type { SQLCodeEditorController } from '../SQLCodeEditor/SQLCodeEditorController';
import { SQLCodeEditorLoader } from '../SQLCodeEditor/SQLCodeEditorLoader';
import { useSQLCodeEditorPanel } from './useSQLCodeEditorPanel';

const styles = css`
  box {
    display: flex;
    flex: 1;
    overflow: auto;
  }

  SQLCodeEditorLoader {
    flex: 1;
    overflow: auto;
  }
`;

export const SQLCodeEditorPanel: TabContainerPanelComponent<ISqlEditorModeProps> = observer(function SQLCodeEditorPanel({
  data,
}) {
  const [sqlCodeEditorController, setEditor] = useState<SQLCodeEditorController | null>(null);
  const navNodeManagerService = useService(NavNodeManagerService);
  const panelData = useSQLCodeEditorPanel(data, sqlCodeEditorController);
  const dndBox = useDNDBox({
    canDrop: context => context.has(DATA_CONTEXT_NAV_NODE),
    onDrop: (context, mouse) => {
      const node = context.get(DATA_CONTEXT_NAV_NODE);
      const editor = sqlCodeEditorController?.getEditor();

      if (editor && mouse) {
        const alias = navNodeManagerService.getNodeDatabaseAlias(node.id);

        if (alias) {
          const pos = editor.coordsChar({ left: mouse.x, top: mouse.y });
          const doc = editor.getDoc();
          doc.replaceRange(alias, pos);
          editor.setCursor({ ...pos, ch: pos.ch + alias.length });
        }

        editor.focus();
      }
    },
  });

  useEffect(() => {
    sqlCodeEditorController?.focus();
  }, [sqlCodeEditorController]);

  return styled(styles)(
    <box ref={dndBox.setRef}>
      <SQLCodeEditorLoader
        ref={setEditor}
        readonly={data.readonly}
        bindings={panelData.bindings}
        dialect={data.dialect}
        value={data.value}
      />
    </box>
  );
});