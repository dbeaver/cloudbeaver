/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { NavNodeManagerService } from '@cloudbeaver/core-app';
import { injectable } from '@cloudbeaver/core-di';
import { download, generateFileName } from '@cloudbeaver/core-utils';
import { ActionService, ACTION_SAVE, DATA_CONTEXT_MENU, MenuService } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DDL_VIEWER_NODE } from './DATA_CONTEXT_DDL_VIEWER_NODE';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from './DATA_CONTEXT_DDL_VIEWER_VALUE';
import { MENU_DDL_VIEWER_FOOTER } from './MENU_DDL_VIEWER_FOOTER';

@injectable()
export class DDLViewerFooterService {
  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly actionsService: ActionService,
    private readonly menuService: MenuService,
  ) { }

  register(): void {
    this.actionsService.addHandler({
      id: 'ddl-viewer-footer-base-handler',
      isActionApplicable(context, action) {
        const menu = context.find(DATA_CONTEXT_MENU, MENU_DDL_VIEWER_FOOTER);
        const node = context.tryGet(DATA_CONTEXT_DDL_VIEWER_NODE);

        if (!menu || !node) {
          return false;
        }

        if (action === ACTION_SAVE) {
          const ddl = context.tryGet(DATA_CONTEXT_DDL_VIEWER_VALUE);
          return !!ddl;
        }

        return false;
      },
      handler: (context, action) => {
        switch (action) {
          case ACTION_SAVE: {
            const ddl = context.get(DATA_CONTEXT_DDL_VIEWER_VALUE);
            const nodeId = context.get(DATA_CONTEXT_DDL_VIEWER_NODE);

            const blob = new Blob([ddl], {
              type: 'application/sql',
            });

            const node = nodeId ? this.navNodeManagerService.getNode(nodeId) : undefined;
            const name = node?.name ? `DDL_${node.nodeType ? node.nodeType + '_' : ''}${node.name}` : 'DDL';

            download(blob, generateFileName(name, '.sql'));
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_DDL_VIEWER_FOOTER,
      getItems: (context, items) => [
        ...items,
        ACTION_SAVE,
      ],
    });
  }
}
