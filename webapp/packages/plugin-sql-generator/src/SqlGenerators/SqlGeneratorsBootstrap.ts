/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { DATA_CONTEXT_NAV_NODE, NavNodeInfoResource, type NavNode } from '@cloudbeaver/core-navigation-tree';
import { getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_ELEMENTS_TREE } from '@cloudbeaver/plugin-navigation-tree';

import { SqlGeneratorsResource } from './SqlGeneratorsResource.js';
import { getSqlGenerationActions } from './getSqlGenerationActions.js';
import { MENU_SQL_GENERATORS } from './MENU_SQL_GENERATORS.js';
import { getSqlGenerationNodes, isSqlGenerationNode } from './sqlGenerationSelection.js';
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
      getLoader: context =>
        getCachedMapResourceLoaderState(this.sqlGeneratorsResource, () => {
          const nodes = this.getNodes(context);
          return nodes.length > 0 ? { nodeIds: nodes.map(node => node.uri) } : null;
        }),
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
        const nodes = this.getNodes(context);
        const generators = this.sqlGeneratorsResource.get({ nodeIds: nodes.map(node => node.uri) }) ?? [];
        const actions = getSqlGenerationActions(nodes, generators);

        return [
          ...items,
          ...actions.map(
            ({ generator, nodes }) =>
              new MenuBaseItem(
                {
                  id: generator.id,
                  label: generator.label,
                  tooltip: generator.description,
                },
                {
                  onSelect: () => this.sqlGenerationService.open(nodes, generator),
                },
              ),
          ),
        ];
      },
    });
  }

  private getNodes(context: IDataContextProvider): NavNode[] {
    const node = context.get(DATA_CONTEXT_NAV_NODE);
    // Node menus do not always expose DATA_CONTEXT_NAV_NODES.
    const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);

    return getSqlGenerationNodes(node, tree?.getSelected().map(id => this.navNodeInfoResource.get(id)) ?? []).filter(isSqlGenerationNode);
  }
}
