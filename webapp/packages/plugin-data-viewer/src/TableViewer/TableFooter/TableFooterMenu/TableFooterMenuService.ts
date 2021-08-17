/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  ContextMenuService, IMenuContext, IContextMenuItem, IMenuItem
} from '@cloudbeaver/core-dialogs';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseEditAction } from '../../../DatabaseDataModel/Actions/DatabaseEditAction';
import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import { ScriptPreviewService } from '../../../ScriptPreview/ScriptPreviewService';

export interface ITableFooterMenuContext {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
}

@injectable()
export class TableFooterMenuService {
  static nodeContextType = 'NodeWithParent';
  private tableFooterMenuToken = 'tableFooterMenu';

  constructor(
    private contextMenuService: ContextMenuService,
    private scriptPreviewService: ScriptPreviewService,
  ) {
    this.contextMenuService.addPanel(this.tableFooterMenuToken);

    this.registerMenuItem({
      id: 'save ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isDisabled(context) {
        if (
          context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.source.hasResult(context.data.resultIndex)
        ) {
          return true;
        }

        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        return !editor?.isEdited();
      },
      order: 1,
      title: 'ui_processing_save',
      icon: 'table-save',
      onClick: context => context.data.model.source.saveData(),
    });

    this.registerMenuItem({
      id: 'cancel ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isDisabled(context) {
        if (
          context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.source.hasResult(context.data.resultIndex)
        ) {
          return true;
        }

        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        return !editor?.isEdited();
      },
      order: 2,
      title: 'data_viewer_value_revert',
      tooltip: 'data_viewer_value_revert_title',
      icon: 'table-revert',
      onClick: context => {
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );
        editor?.clear();
      },
    });

    this.registerMenuItem({
      id: 'script',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        return context.data.model.source.getResult(context.data.resultIndex)?.dataFormat !== ResultDataFormat.Resultset;
      },
      isDisabled(context) {
        if (
          context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.source.hasResult(context.data.resultIndex)
        ) {
          return true;
        }
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );
        return !editor?.isEdited();
      },
      order: 3,
      title: 'data_viewer_script_preview',
      tooltip: 'data_viewer_script_preview',
      icon: 'sql-script-preview',
      onClick: async context => {
        await this.scriptPreviewService.open(context.data.model, context.data.resultIndex);
      },
    });
  }

  constructMenuWithContext(model: IDatabaseDataModel<any>, resultIndex: number): IMenuItem[] {
    const context: IMenuContext<ITableFooterMenuContext> = {
      menuId: this.tableFooterMenuToken,
      contextId: model.id,
      contextType: TableFooterMenuService.nodeContextType,
      data: { model, resultIndex },
    };
    return this.contextMenuService.createContextMenu(context, this.tableFooterMenuToken).menuItems;
  }

  registerMenuItem(options: IContextMenuItem<ITableFooterMenuContext>): void {
    this.contextMenuService.addMenuItem<ITableFooterMenuContext>(this.tableFooterMenuToken, options);
  }
}
