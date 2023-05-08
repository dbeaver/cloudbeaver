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

import { useCombinedRef, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODE, getNodesFromContext, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { TabContainerPanelComponent, useDNDBox } from '@cloudbeaver/core-ui';
import type { IEditorRef } from '@cloudbeaver/plugin-codemirror6';
import type { ISqlEditorModeProps } from '@cloudbeaver/plugin-sql-editor';

import { ACTIVE_QUERY_EXTENSION } from '../ACTIVE_QUERY_EXTENSION';
import { QUERY_STATUS_GUTTER_EXTENSION } from '../QUERY_STATUS_GUTTER_EXTENSION';
import { SQLCodeEditorLoader } from '../SQLCodeEditor/SQLCodeEditorLoader';
import { useSQLCodeEditor } from '../SQLCodeEditor/useSQLCodeEditor';
import { useSqlDIalectAutocompletion } from '../useSqlDIalectAutocompletion';
import { useSQLCodeEditorPanel } from './useSQLCodeEditorPanel';

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

  const editor = useSQLCodeEditor(editorRef);
  const panel = useSQLCodeEditorPanel(data, editor);
  const [autocompletion, setEditor, autocompletionStyles] = useSqlDIalectAutocompletion(data);
  const combinedRef = useCombinedRef(setEditorRef, setEditor);

  const dndBox = useDNDBox({
    canDrop: context => context.has(DATA_CONTEXT_NAV_NODE),
    onDrop: async (context, mouse) => {
      const nodes = getNodesFromContext(context);
      const view = editorRef?.view;

      if (view && mouse) {
        try {
          const pos = view.posAtCoords({ x: mouse.x, y: mouse.y }) ?? 1;

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

  return styled(useStyles(styles, autocompletionStyles))(
    <box ref={dndBox.setRef}>
      <SQLCodeEditorLoader
        ref={combinedRef}
        value={data.value}
        extensions={[ACTIVE_QUERY_EXTENSION, QUERY_STATUS_GUTTER_EXTENSION, autocompletion]}
        readonly={data.readonly}
        autoFocus
        onChange={panel.onQueryChange}
        onUpdate={panel.onUpdate}
      />
    </box>
  );
});