/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { MenuBaseItem, DATA_CONTEXT_MENU, MenuService, DATA_CONTEXT_MENU_NESTED } from '@cloudbeaver/core-view';

import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { DATA_CONTEXT_NAV_NODE } from '../NodesManager/DATA_CONTEXT_NAV_NODE';
import { GeneratedSqlDialog } from './GeneratedSqlDialog';
import { MENU_SQL_GENERATORS } from './MENU_SQL_GENERATORS';
import { SqlGeneratorsResource } from './SqlGeneratorsResource';

@injectable()
export class SqlGeneratorsBootstrap extends Bootstrap {
  constructor(
    private readonly sqlGeneratorsResource: SqlGeneratorsResource,
    private readonly commonDialogService: CommonDialogService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  register(): void {
    this.menuService.setHandler({
      id: 'node-sql-generators',
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_SQL_GENERATORS,
      isLoading: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        return this.sqlGeneratorsResource.isDataLoading(node.id);
      },
      isDisabled: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        return this.sqlGeneratorsResource.get(node.id)?.length === 0;
      },
      handler: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        this.sqlGeneratorsResource.load(node.id);
      },
    });
    this.menuService.addCreator({
      isApplicable: context => {
        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (
          !node
          || !(
            node.objectFeatures.includes(EObjectFeature.entity)
            || node.objectFeatures.includes(EObjectFeature.script)
          )
        ) {
          return false;
        }

        return !context.find(DATA_CONTEXT_MENU, MENU_SQL_GENERATORS) && !context.has(DATA_CONTEXT_MENU_NESTED);
      },
      getItems: (context, items) => [
        ...items,
        MENU_SQL_GENERATORS,
      ],
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_SQL_GENERATORS,
      getItems: (context, items) => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        const actions = this.sqlGeneratorsResource.get(node.id) || [];

        return [
          ...items,
          ...actions.map(action => new MenuBaseItem(
            {
              id: action.id,
              label: action.label,
              tooltip: action.description,
            },
            {
              onSelect: () => {
                this.commonDialogService.open(GeneratedSqlDialog, {
                  generatorId: action.id,
                  pathId: node.id,
                });
              },
            }
          )),
        ];
      },
    });
  }

  load(): void | Promise<void> { }
}
