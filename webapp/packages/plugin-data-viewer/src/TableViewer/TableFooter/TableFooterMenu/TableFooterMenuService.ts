/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
import { DatabaseSelectAction } from '../../../DatabaseDataModel/Actions/DatabaseSelectAction';
import { DatabaseEditChangeType } from '../../../DatabaseDataModel/Actions/IDatabaseDataEditAction';
import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseDataResult } from '../../../DatabaseDataModel/IDatabaseDataResult';
import { ScriptPreviewService } from '../../../ScriptPreview/ScriptPreviewService';

export interface ITableFooterMenuContext {
  model: IDatabaseDataModel;
  resultIndex: number;
}

@injectable()
export class TableFooterMenuService {
  static nodeContextType = 'NodeWithParent';
  private readonly tableFooterMenuToken = 'tableFooterMenu';

  constructor(
    private readonly contextMenuService: ContextMenuService,
    private readonly scriptPreviewService: ScriptPreviewService,
  ) {
    this.contextMenuService.addPanel(this.tableFooterMenuToken);

    this.registerMenuItem({
      id: 'table_add',
      order: 0.5,
      icon: '/icons/data_add.svg',
      tooltip: 'data_viewer_action_edit_add',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        if (context.data.model.isReadonly()) {
          return true;
        }

        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        return !editor?.hasFeature('add');
      },
      isDisabled(context) {
        return (
          context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.source.hasResult(context.data.resultIndex)
        );
      },
      onClick(context) {
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        if (!editor) {
          return;
        }

        const select = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseSelectAction
        );

        editor.add(select?.getFocusedElement());
      },
    });
    this.registerMenuItem({
      id: 'table_add_copy',
      order: 0.55,
      icon: '/icons/data_add_copy.svg',
      tooltip: 'data_viewer_action_edit_add_copy',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        if (context.data.model.isReadonly()) {
          return true;
        }

        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        return !editor?.hasFeature('add');
      },
      isDisabled(context) {
        if (
          context.data.model.isLoading()
          || context.data.model.isDisabled(context.data.resultIndex)
          || !context.data.model.source.hasResult(context.data.resultIndex)
        ) {
          return true;
        }

        const selectedElements = getActiveElements(context.data.model, context.data.resultIndex);

        return selectedElements.length === 0;
      },
      onClick(context) {
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        if (!editor) {
          return;
        }

        const selectedElements = getActiveElements(context.data.model, context.data.resultIndex);

        editor.duplicate(...selectedElements);
      },
    });
    this.registerMenuItem({
      id: 'table_delete',
      order: 0.6,
      icon: '/icons/data_delete.svg',
      tooltip: 'data_viewer_action_edit_delete',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        if (context.data.model.isReadonly()) {
          return true;
        }

        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        return !editor?.hasFeature('delete');
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

        if (!editor) {
          return true;
        }

        const selectedElements = getActiveElements(context.data.model, context.data.resultIndex);

        if (selectedElements.length === 0) {
          return true;
        }

        return !selectedElements.some(key => editor.getElementState(key) !== DatabaseEditChangeType.delete);
      },
      onClick(context) {
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        const selectedElements = getActiveElements(context.data.model, context.data.resultIndex);

        editor?.delete(...selectedElements);
      },
    });
    this.registerMenuItem({
      id: 'table_revert',
      order: 0.7,
      icon: '/icons/data_revert.svg',
      tooltip: 'data_viewer_action_edit_revert',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        if (context.data.model.isReadonly()) {
          return true;
        }

        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        return !editor;
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

        const selectedElements = getActiveElements(context.data.model, context.data.resultIndex);

        return (
          !editor
          || selectedElements.length === 0
          || !selectedElements.some(key => {
            const state = editor.getElementState(key);

            if (state === DatabaseEditChangeType.add) {
              return editor.isElementEdited(key);
            }

            return state !== null;
          })
        );
      },
      onClick(context) {
        const editor = context.data.model.source.getActionImplementation(
          context.data.resultIndex,
          DatabaseEditAction
        );

        const selectedElements = getActiveElements(context.data.model, context.data.resultIndex);

        editor?.revert(...selectedElements);
      },
    });
    this.registerMenuItem({
      id: 'save ',
      order: 1,
      title: 'ui_processing_save',
      icon: 'table-save',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        return context.data.model.isReadonly();
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
      onClick: context => context.data.model.save(),
    });

    this.registerMenuItem({
      id: 'cancel ',
      order: 2,
      title: 'data_viewer_value_revert',
      tooltip: 'data_viewer_value_revert_title',
      icon: '/icons/data_revert_all.svg',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        return context.data.model.isReadonly();
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
      order: 3,
      title: 'data_viewer_script_preview',
      tooltip: 'data_viewer_script_preview',
      icon: 'sql-script-preview',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isHidden(context) {
        return context.data.model.isReadonly()
          || context.data.model.source.getResult(context.data.resultIndex)?.dataFormat !== ResultDataFormat.Resultset;
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
      onClick: async context => {
        await this.scriptPreviewService.open(context.data.model, context.data.resultIndex);
      },
    });
  }

  constructMenuWithContext(model: IDatabaseDataModel, resultIndex: number): IMenuItem[] {
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

function getActiveElements(model: IDatabaseDataModel, resultIndex: number): unknown[] {
  const select = model.source.getActionImplementation(
    resultIndex,
    DatabaseSelectAction
  );

  return select?.getActiveElements() ?? [];
}
