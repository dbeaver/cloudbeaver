/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import {
  ACTION_ADD,
  ACTION_CANCEL,
  ACTION_DELETE,
  ACTION_DUPLICATE,
  ACTION_REVERT,
  ACTION_SAVE,
  ActionService,
  MenuService,
} from '@cloudbeaver/core-view';

import { DatabaseEditAction } from '../../../DatabaseDataModel/Actions/DatabaseEditAction.js';
import { DatabaseSelectAction } from '../../../DatabaseDataModel/Actions/DatabaseSelectAction.js';
import { DatabaseEditChangeType } from '../../../DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import { DATA_CONTEXT_DV_DDM } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import { DATA_CONTEXT_DV_PRESENTATION, DataViewerPresentationType } from '../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_PRESENTATION.js';
import type { IDatabaseDataModel } from '../../../DatabaseDataModel/IDatabaseDataModel.js';
import { DATA_VIEWER_DATA_MODEL_ACTIONS_MENU } from './DATA_VIEWER_DATA_MODEL_ACTIONS_MENU.js';

@injectable()
export class TableFooterMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  register() {
    this.registerEditingActions();
  }

  private registerEditingActions() {
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const presentation = context.get(DATA_CONTEXT_DV_PRESENTATION);

        return !model.isReadonly(resultIndex) && !presentation?.readonly && (!presentation || presentation.type === DataViewerPresentationType.Data);
      },
      getItems(context, items) {
        return [ACTION_ADD, ACTION_DUPLICATE, ACTION_DELETE, ACTION_REVERT, ACTION_SAVE, ACTION_CANCEL, ...items];
      },
    });
    this.actionService.addHandler({
      id: 'data-base-editing-handler',
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      actions: [ACTION_ADD, ACTION_DUPLICATE, ACTION_DELETE, ACTION_REVERT, ACTION_SAVE, ACTION_CANCEL],
      isActionApplicable(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (model.isReadonly(resultIndex)) {
          return false;
        }

        const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);

        if (!editor) {
          return false;
        }

        switch (action) {
          case ACTION_DUPLICATE:
          case ACTION_ADD: {
            return editor.hasFeature('add');
          }
          case ACTION_DELETE: {
            return editor.hasFeature('delete');
          }
          case ACTION_REVERT: {
            return editor.hasFeature('revert');
          }
        }
        return true;
      },
      isDisabled(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (model.isLoading() || model.isDisabled(resultIndex) || !model.source.getResult(resultIndex)) {
          return true;
        }

        switch (action) {
          case ACTION_DUPLICATE: {
            const selectedElements = getActiveElements(model, resultIndex);

            return selectedElements.length === 0;
          }
          case ACTION_DELETE: {
            const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);
            const selectedElements = getActiveElements(model, resultIndex);

            const canEdit =
              model.hasElementIdentifier(resultIndex) || selectedElements.every(key => editor?.getElementState(key) === DatabaseEditChangeType.add);

            if (!editor || !canEdit) {
              return true;
            }

            return selectedElements.length === 0 || !selectedElements.some(key => editor.getElementState(key) !== DatabaseEditChangeType.delete);
          }
          case ACTION_REVERT: {
            const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);

            if (!editor) {
              return true;
            }

            const selectedElements = getActiveElements(model, resultIndex);

            return (
              selectedElements.length === 0 ||
              !selectedElements.some(key => {
                const state = editor.getElementState(key);

                if (state === DatabaseEditChangeType.add) {
                  return editor.isElementEdited(key);
                }

                return state !== null;
              })
            );
          }
          case ACTION_SAVE:
          case ACTION_CANCEL: {
            const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);

            return !editor?.isEdited();
          }
        }

        return false;
      },
      getActionInfo(context, action) {
        switch (action) {
          case ACTION_ADD:
            return { ...action.info, label: '', icon: '/icons/data_add_sm.svg', tooltip: 'data_viewer_action_edit_add' };
          case ACTION_DUPLICATE:
            return { ...action.info, label: '', icon: '/icons/data_add_copy_sm.svg', tooltip: 'data_viewer_action_edit_add_copy' };
          case ACTION_DELETE:
            return { ...action.info, label: '', icon: '/icons/data_delete_sm.svg', tooltip: 'data_viewer_action_edit_delete' };
          case ACTION_REVERT:
            return { ...action.info, label: '', icon: '/icons/data_revert_sm.svg', tooltip: 'data_viewer_action_edit_revert' };
          case ACTION_SAVE:
            return { ...action.info, icon: 'table-save' };
          case ACTION_CANCEL:
            return { ...action.info, icon: '/icons/data_revert_all_sm.svg', tooltip: 'data_viewer_value_revert_title' };
        }

        return action.info;
      },
      handler: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const editor = model.source.getActionImplementation(resultIndex, DatabaseEditAction);

        if (!editor) {
          return;
        }
        const select = model.source.getActionImplementation(resultIndex, DatabaseSelectAction);
        const selectedElements = getActiveElements(model, resultIndex);

        switch (action) {
          case ACTION_ADD: {
            editor.add(select?.getFocusedElement());
            break;
          }
          case ACTION_DUPLICATE: {
            editor.duplicate(...selectedElements);
            break;
          }
          case ACTION_DELETE: {
            editor.delete(...selectedElements);
            break;
          }
          case ACTION_REVERT: {
            editor.revert(...selectedElements);
            break;
          }
          case ACTION_SAVE:
            model.save().catch(() => {});
            break;
          case ACTION_CANCEL: {
            editor.clear();
            break;
          }
        }
      },
    });
  }
}

function getActiveElements(model: IDatabaseDataModel, resultIndex: number): unknown[] {
  const select = model.source.getActionImplementation(resultIndex, DatabaseSelectAction);

  return select?.getActiveElements() ?? [];
}
