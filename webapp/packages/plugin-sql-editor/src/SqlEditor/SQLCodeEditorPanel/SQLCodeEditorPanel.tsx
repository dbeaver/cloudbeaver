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

import { DATA_CONTEXT_NAV_NODE, DATA_CONTEXT_NAV_NODES, NavNode, NavNodeManagerService } from '@cloudbeaver/core-app';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { TabContainerPanelComponent, useDNDBox } from '@cloudbeaver/core-ui';
import type { IDataContextProvider } from '@cloudbeaver/core-view';

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
  const notificationService = useService(NotificationService);
  const [sqlCodeEditorController, setEditor] = useState<SQLCodeEditorController | null>(null);
  const navNodeManagerService = useService(NavNodeManagerService);
  const panelData = useSQLCodeEditorPanel(data, sqlCodeEditorController);
  const dndBox = useDNDBox({
    canDrop: context => context.has(DATA_CONTEXT_NAV_NODE),
    onDrop: async (context, mouse) => {
      const nodes = getNodes(context);
      const editor = sqlCodeEditorController?.getEditor();

      if (editor && mouse) {
        try {
          const pos = editor.coordsChar({ left: mouse.x, top: mouse.y });
          editor.setCursor(pos);

          await data.executeQueryAction(data.cursorSegment, async () => {
            const alias: string[] = [];

            for (const node of nodes) {
              alias.push(await navNodeManagerService.getNodeDatabaseAlias(node.id));
            }

            const replacement = alias.join(', ');
            if (replacement) {
              const doc = editor.getDoc();

              doc.replaceRange(replacement, pos);
              editor.setCursor({ ...pos, ch: pos.ch + replacement.length });
            }

            editor.focus();
          }, true, true);
        } catch (exception: any) {
          notificationService.logException(exception, 'sql_editor_alias_loading_error');
        }
      }
    },
  });

  function getNodes(context: IDataContextProvider): NavNode[] {
    const node = context.get(DATA_CONTEXT_NAV_NODE);
    const getNodes = context.get(DATA_CONTEXT_NAV_NODES);
    let nodes = getNodes();

    if (nodes.length < 2) {
      nodes = [];
    }

    if (!nodes.includes(node)) {
      nodes.push(node);
    }

    return nodes;
  }

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