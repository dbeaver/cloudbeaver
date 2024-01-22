/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { download, withTimestamp } from '@cloudbeaver/core-utils';
import { ACTION_SAVE, ActionService, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';
import { LocalStorageSqlDataSource } from '@cloudbeaver/plugin-sql-editor';
import { ACTION_SQL_EDITOR_OPEN, SqlEditorNavigatorService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from './DATA_CONTEXT_DDL_VIEWER_VALUE';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER';

@injectable()
export class DDLViewerFooterService {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly actionsService: ActionService,
    private readonly menuService: MenuService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {}

  register(): void {
    this.actionsService.addHandler({
      id: 'ddl-viewer-footer-base-handler',
      isActionApplicable(context, action) {
        const menu = context.hasValue(DATA_CONTEXT_MENU, MENU_DDL_VIEWER_FOOTER);
        const node = context.tryGet(DATA_CONTEXT_DDL_VIEWER_NODE);

        if (!menu || !node) {
          return false;
        }

        if (action === ACTION_SAVE || action === ACTION_SQL_EDITOR_OPEN) {
          const ddl = context.tryGet(DATA_CONTEXT_DDL_VIEWER_VALUE);
          return !!ddl;
        }

        return false;
      },
      handler: async (context, action) => {
        switch (action) {
          case ACTION_SAVE: {
            const ddl = context.get(DATA_CONTEXT_DDL_VIEWER_VALUE);
            const nodeId = context.get(DATA_CONTEXT_DDL_VIEWER_NODE);

            const blob = new Blob([ddl], {
              type: 'application/sql',
            });

            const node = nodeId ? this.navNodeManagerService.getNode(nodeId) : undefined;
            const name = node?.name ? `DDL_${node.nodeType ? node.nodeType + '_' : ''}${node.name}` : 'DDL';

            download(blob, `${withTimestamp(name)}.sql`);
            break;
          }
          case ACTION_SQL_EDITOR_OPEN: {
            const ddl = context.get(DATA_CONTEXT_DDL_VIEWER_VALUE);
            const nodeId = context.get(DATA_CONTEXT_DDL_VIEWER_NODE);

            const connection = this.connectionInfoResource.getConnectionForNode(nodeId);
            const container = this.navNodeManagerService.getNodeContainerInfo(nodeId);
            const node = this.navNodeManagerService.getNode(nodeId);
            const path = [];

            if (container.schemaId) {
              path.push(container.schemaId);
            }
            if (node?.name && node.name !== container.schemaId) {
              path.push(node.name);
            }

            const connectionName = connection?.name ? '<' + connection.name + '> ' : '';
            const name = `${connectionName}DDL${path.length ? ' of <' + path.join('.') + '>' : ''}`;

            await this.sqlEditorNavigatorService.openNewEditor({
              name,
              dataSourceKey: LocalStorageSqlDataSource.key,
              connectionKey: connection && createConnectionParam(connection),
              catalogId: container.catalogId,
              schemaId: container.schemaId,
              query: ddl,
            });
            break;
          }
        }
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_SQL_EDITOR_OPEN) {
          return { ...action.info, icon: '/icons/sql_script_m.svg' };
        }
        return action.info;
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_DDL_VIEWER_FOOTER,
      getItems: (context, items) => [...items, ACTION_SAVE, ACTION_SQL_EDITOR_OPEN],
    });
  }
}
