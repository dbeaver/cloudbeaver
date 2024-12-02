/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { MenuBarSmallItem, useExecutor, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { DATA_CONTEXT_NAV_NODE, getNodesFromContext, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { type TabContainerPanelComponent, useDNDBox } from '@cloudbeaver/core-ui';
import { closeCompletion, type IEditorRef, Prec, ReactCodemirrorPanel, useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import type { ISqlEditorModeProps } from '@cloudbeaver/plugin-sql-editor';

import { ACTIVE_QUERY_EXTENSION } from '../ACTIVE_QUERY_EXTENSION.js';
import { QUERY_STATUS_GUTTER_EXTENSION } from '../QUERY_STATUS_GUTTER_EXTENSION.js';
import { SQLCodeEditorLoader } from '../SQLCodeEditor/SQLCodeEditorLoader.js';
import { useSQLCodeEditor } from '../SQLCodeEditor/useSQLCodeEditor.js';
import { useSqlDialectAutocompletion } from '../useSqlDialectAutocompletion.js';
import { useSqlDialectExtension } from '../useSqlDialectExtension.js';
import style from './SQLCodeEditorPanel.module.css';
import { SqlEditorInfoBar } from './SqlEditorInfoBar.js';
import { useSQLCodeEditorPanel } from './useSQLCodeEditorPanel.js';

export const SQLCodeEditorPanel: TabContainerPanelComponent<ISqlEditorModeProps> = observer(function SQLCodeEditorPanel({ data }) {
  const notificationService = useService(NotificationService);
  const navNodeManagerService = useService(NavNodeManagerService);
  const translate = useTranslate();

  const styles = useS(style);
  const [editorRef, setEditorRef] = useState<IEditorRef | null>(null);

  const editor = useSQLCodeEditor(editorRef);

  const panel = useSQLCodeEditorPanel(data, editor);
  const extensions = useCodemirrorExtensions(undefined, [ACTIVE_QUERY_EXTENSION, Prec.lowest(QUERY_STATUS_GUTTER_EXTENSION)]);
  const autocompletion = useSqlDialectAutocompletion(data);
  const sqlDialect = useSqlDialectExtension(data.dialect);

  extensions.set(...autocompletion);
  extensions.set(...sqlDialect);

  const dndBox = useDNDBox({
    canDrop: context => context.has(DATA_CONTEXT_NAV_NODE),
    onDrop: async (context, mouse) => {
      const nodes = getNodesFromContext(context);
      const view = editorRef?.view;

      if (view && mouse) {
        try {
          const pos = view.posAtCoords({ x: mouse.x, y: mouse.y }) ?? 1;

          await data.executeQueryAction(
            data.cursorSegment,
            async () => {
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
            },
            true,
            true,
          );
        } catch (exception: any) {
          notificationService.logException(exception, 'sql_editor_alias_loading_error');
        }
      }
    },
  });

  useExecutor({
    executor: data.onExecute,
    handlers: [
      function updateHighlight() {
        if (editor.view) {
          closeCompletion(editor.view);
        }
      },
    ],
  });

  function applyIncoming() {
    data.dataSource?.applyIncoming();
  }

  function keepCurrent() {
    data.dataSource?.keepCurrent();
  }

  return (
    <div ref={dndBox.setRef} className={styles['box']}>
      <SQLCodeEditorLoader
        ref={setEditorRef}
        getValue={() => data.value}
        cursor={{
          anchor: data.cursor.anchor,
          head: data.cursor.head,
        }}
        incomingValue={data.incomingValue}
        extensions={extensions}
        readonly={data.readonly}
        autoFocus
        lineNumbers
        onChange={panel.onQueryChange}
        onCursorChange={selection => panel.onCursorChange(selection.anchor, selection.head)}
      >
        {data.isIncomingChanges && (
          <>
            <ReactCodemirrorPanel className={styles['reactCodemirrorPanel']} top>
              <MenuBarSmallItem title={translate('plugin_sql_editor_new_merge_conflict_keep_current_tooltip')} onClick={keepCurrent}>
                {translate('plugin_sql_editor_new_merge_conflict_keep_current_label')}
              </MenuBarSmallItem>
            </ReactCodemirrorPanel>
            <ReactCodemirrorPanel className={styles['reactCodemirrorPanel']} top incomingView>
              <MenuBarSmallItem title={translate('plugin_sql_editor_new_merge_conflict_accept_incoming_tooltip')} onClick={applyIncoming}>
                {translate('plugin_sql_editor_new_merge_conflict_accept_incoming_label')}
              </MenuBarSmallItem>
            </ReactCodemirrorPanel>
          </>
        )}
        {editor.state && (
          <ReactCodemirrorPanel>
            <SqlEditorInfoBar state={editor.state} />
          </ReactCodemirrorPanel>
        )}
      </SQLCodeEditorLoader>
    </div>
  );
});
