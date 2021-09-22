/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ComputedContextMenuModel, ContextMenuService, IContextMenuItem } from '@cloudbeaver/core-dialogs';
import type { SqlQueryGenerator } from '@cloudbeaver/core-sdk';

import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { INodeMenuData, NavNodeContextMenuService } from '../../shared/NodesManager/NavNodeContextMenuService';
import { GeneratedSqlDialog } from './GeneratedSqlDialog';
import { MAX_GENERATORS_LENGTH, SqlGeneratorsResource } from './SqlGeneratorsResource';

@injectable()
export class SqlGeneratorsBootstrap extends Bootstrap {
  private static readonly sqlGeneratorsToken = 'sqlGenerators';

  constructor(
    private readonly sqlGeneratorsResource: SqlGeneratorsResource,
    private readonly contextMenuService: ContextMenuService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
  }

  private getSqlGeneratorsToken() {
    return SqlGeneratorsBootstrap.sqlGeneratorsToken;
  }

  private getSqlGeneratorsItems(
    generatorsGetter: () => SqlQueryGenerator[]
  ): Array<IContextMenuItem<INodeMenuData>> {
    return Array.from(Array(MAX_GENERATORS_LENGTH).keys()).map(index => {
      const id = String(index) + 'Generator';
      return {
        id,
        isPresent: () => true,
        isHidden: () => {
          const generators = generatorsGetter();
          return index >= generators.length;
        },
        titleGetter: () => {
          const generators = generatorsGetter();

          if (index >= generators.length) {
            return '';
          }

          return generators[index].label;
        },
        onClick: context => {
          const generators = generatorsGetter();

          if (index < generators.length) {
            this.commonDialogService.open(GeneratedSqlDialog, {
              generatorId: generators[index].id,
              pathId: context.data.node.id,
            });
          }
        },
      };
    });
  }

  register(): void {
    this.contextMenuService.addMenuItem<INodeMenuData>(
      this.contextMenuService.getRootMenuToken(),
      {
        id: this.getSqlGeneratorsToken(),
        order: 3,
        title: 'app_shared_sql_generators_panel_title',
        isPresent(context) {
          return context.contextType === NavNodeContextMenuService.nodeContextType
            && (
              context.data.node.objectFeatures.includes(EObjectFeature.entity)
              || context.data.node.objectFeatures.includes(EObjectFeature.script)
            );
        },
        isProcessing: context => this.sqlGeneratorsResource.isDataLoading(context.data.node.id),
        isPanelAvailable: context => this.sqlGeneratorsResource.isLoaded(context.data.node.id),
        isDisabled: context => this.sqlGeneratorsResource.get(context.data.node.id)?.length === 0,
        onClick: context => this.sqlGeneratorsResource.load(context.data.node.id),
        onMouseEnter: context => this.sqlGeneratorsResource.load(context.data.node.id),
        panel: new ComputedContextMenuModel<INodeMenuData>({
          id: 'generatorsPanel',
          menuItemsGetter: context => this.getSqlGeneratorsItems(
            () => this.sqlGeneratorsResource.get(context.data.node.id) || []
          ),
        }),
      }
    );
  }

  load(): void | Promise<void> { }
}
