/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODE, getNodesFromContext, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { TabContainerPanelComponent, useDNDBox } from '@cloudbeaver/core-ui';
import { classExtension, IEditorRef, LANG_EXT, ViewUpdate } from '@cloudbeaver/plugin-codemirror6';
import type { ISqlEditorModeProps } from '@cloudbeaver/plugin-sql-editor';

import { SQLCodeEditorLoader } from '../SQLCodeEditor/SQLCodeEditorLoader';

const styles = css`
  box {
    display: flex;
    flex: 1;
    overflow: auto;
  }
`;

export const SQLCodeEditorPanel: TabContainerPanelComponent<ISqlEditorModeProps> = observer(function SQLCodeEditorPanel({
  data,
}) {
  const notificationService = useService(NotificationService);
  const navNodeManagerService = useService(NavNodeManagerService);

  const [editorRef, setEditorRef] = useState<IEditorRef | null>(null);

  const dndBox = useDNDBox({
    canDrop: context => context.has(DATA_CONTEXT_NAV_NODE),
    onDrop: async (context, mouse) => {
      const nodes = getNodesFromContext(context);
      const view = editorRef?.view;

      if (view && mouse) {
        try {
          const pos = view.posAtCoords({ x: mouse.x, y: mouse.y }) ?? 1;

          view.dispatch({
            selection: {
              anchor: pos,
              head: pos,
            },
          });

          await data.executeQueryAction(data.cursorSegment, async () => {
            const alias: string[] = [];

            for (const node of nodes) {
              alias.push(await navNodeManagerService.getNodeDatabaseAlias(node.id));
            }

            const replacement = alias.join(', ');
            if (replacement) {
              view.dispatch({
                changes: { from: pos, to: pos, insert: replacement },
                selection: { anchor: pos, head: pos + replacement.length },
              });
            }
          }, true, true);
        } catch (exception: any) {
          notificationService.logException(exception, 'sql_editor_alias_loading_error');
        }
      }
    },
  });

  return styled(styles)(
    <box ref={dndBox.setRef}>
      <SQLCodeEditorLoader
        ref={setEditorRef}
        value={data.value}
        extensions={[LANG_EXT.sql(), classExtension]}
        readonly={data.readonly}
        editable={!data.readonly}
        autoFocus
      />
    </box>
  );
});