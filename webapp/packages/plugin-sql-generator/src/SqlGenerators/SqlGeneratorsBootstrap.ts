/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { getCachedMapResourceLoaderState, resourceKeyList } from '@cloudbeaver/core-resource';
import { MenuBaseItem, MenuService } from '@cloudbeaver/core-view';

import { SqlGeneratorsResource } from './SqlGeneratorsResource.js';
import { MENU_SQL_GENERATORS } from './MENU_SQL_GENERATORS.js';
import { getSqlGenerationActions, getSqlGenerationNodes, isSqlGenerationNode } from './sqlGenerationSelection.js';
import { SqlGenerationService } from './SqlGenerationService.js';

@injectable(() => [SqlGeneratorsResource, SqlGenerationService, MenuService, NavNodeInfoResource])
export class SqlGeneratorsBootstrap extends Bootstrap {
  constructor(
    private readonly sqlGeneratorsResource: SqlGeneratorsResource,
    private readonly sqlGenerationService: SqlGenerationService,
    private readonly menuService: MenuService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.menuService.setHandler({
      id: 'node-sql-generators',
      menus: [MENU_SQL_GENERATORS],
      contexts: [DATA_CONTEXT_NAV_NODE],
      getLoader: context => {
        const nodes = getSqlGenerationNodes(context, this.navNodeInfoResource);
        const keys = nodes.filter(isSqlGenerationNode).map(node => node.uri);

        return getCachedMapResourceLoaderState(this.sqlGeneratorsResource, () => resourceKeyList(keys));
      },
    });
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_NAV_NODE],
      isApplicable: context => isSqlGenerationNode(context.get(DATA_CONTEXT_NAV_NODE)!),
      getItems: (context, items) => [...items, MENU_SQL_GENERATORS],
    });

    this.menuService.addCreator({
      menus: [MENU_SQL_GENERATORS],
      contexts: [DATA_CONTEXT_NAV_NODE],
      getItems: (context, items) => {
        const nodes = getSqlGenerationNodes(context, this.navNodeInfoResource);
        const actions = getSqlGenerationActions(nodes.map(node => this.sqlGeneratorsResource.get(node.uri) ?? []));

        return [
          ...items,
          ...actions.map(
            action =>
              new MenuBaseItem(
                {
                  id: action.id,
                  label: action.label,
                  tooltip: action.description,
                },
                {
                  onSelect: () => this.sqlGenerationService.open(nodes, action),
                },
              ),
          ),
        ];
      },
    });
  }
}
