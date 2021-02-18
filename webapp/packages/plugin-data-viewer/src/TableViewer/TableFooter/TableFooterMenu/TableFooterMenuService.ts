/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  ContextMenuService, IMenuContext, IContextMenuItem, IMenuItem, CommonDialogService, DialogueStateResult
} from '@cloudbeaver/core-dialogs';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { DetailsError } from '@cloudbeaver/core-sdk';

import type { DataModelWrapper } from '../../DataModelWrapper';
import { ErrorDialog } from '../../ErrorDialog';

export interface ITableFooterMenuContext {
  model: DataModelWrapper;
  resultIndex: number;
}

@injectable()
export class TableFooterMenuService {
  static nodeContextType = 'NodeWithParent';
  private tableFooterMenuToken = 'tableFooterMenu';

  constructor(
    private contextMenuService: ContextMenuService,
    private commonDialogService: CommonDialogService
  ) {
    this.contextMenuService.addPanel(this.tableFooterMenuToken);

    this.registerMenuItem({
      id: 'save ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isDisabled(context) {
        if (context.data.model.deprecatedModels.length === 0) {
          return true;
        }
        const editor = context.data.model.source.getEditor(context.data.resultIndex);

        return context.data.model.isLoading()
        || (!context.data.model.getOldModel(context.data.resultIndex)?.isEdited()
        && !editor.isEdited());
      },
      order: 1,
      title: 'ui_processing_save',
      icon: 'table-save',
      onClick: context => {
        this.saveData(context.data.resultIndex, context.data.model);
      },
    });
    this.registerMenuItem({
      id: 'cancel ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isDisabled(context) {
        if (context.data.model.deprecatedModels.length === 0) {
          return true;
        }

        const editor = context.data.model.source.getEditor(context.data.resultIndex);

        return !context.data.model.getOldModel(context.data.resultIndex)?.isEdited()
        && !editor.isEdited();
      },
      order: 2,
      title: 'ui_processing_cancel',
      icon: 'table-cancel',
      onClick: context => {
        context.data.model.getOldModel(context.data.resultIndex)?.cancelChanges();

        const editor = context.data.model.source.getEditor(context.data.resultIndex);
        editor.cancelChanges();
      },
    });
  }

  constructMenuWithContext(model: DataModelWrapper, resultIndex: number): IMenuItem[] {
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

  private async saveData(resultIndex: number, model: DataModelWrapper) {
    const editor = model.source.getEditor(resultIndex);

    while (true) {
      try {
        if (model.getOldModel(resultIndex)?.isEdited()) {
          await model.getOldModel(resultIndex)?.saveChanges();
        }

        if (editor.isEdited()) {
          await model.source.saveData();
        }
        return;
      } catch (exception) {
        let hasDetails = false;
        let message = `${exception.name}: ${exception.message}`;

        if (exception instanceof DetailsError) {
          hasDetails = exception.hasDetails();
          message = exception.errorMessage;
        }

        const state = await this.commonDialogService.open(
          ErrorDialog,
          {
            message,
            title: 'ui_data_saving_error',
            onShowDetails: hasDetails
              ? () => this.commonDialogService.open(ErrorDetailsDialog, exception)
              : undefined,
          }
        );

        if (state === DialogueStateResult.Rejected) {
          return;
        }
      }
    }
  }
}
