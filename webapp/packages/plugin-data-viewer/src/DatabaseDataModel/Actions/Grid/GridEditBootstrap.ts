/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ACTION_REDO, ACTION_UNDO, ActionService, KeyBindingService, type IAction } from '@cloudbeaver/core-view';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';

import { DATA_CONTEXT_DV_DDM } from '../../DataContext/DATA_CONTEXT_DV_DDM.js';
import { DATA_CONTEXT_DV_DDM_RESULT_INDEX } from '../../DataContext/DATA_CONTEXT_DV_DDM_RESULT_INDEX.js';
import { KEY_BINDING_DATA_VIEWER_CELL_REDO, KEY_BINDING_DATA_VIEWER_CELL_UNDO } from '../../../DATA_VIEWER_KEY_BINDINGS.js';
import { IDatabaseDataEditAction } from '../IDatabaseDataEditAction.js';
import { IDatabaseDataSelectAction } from '../IDatabaseDataSelectAction.js';
import { GridEditAction } from './GridEditAction.js';

@injectable(() => [ActionService, KeyBindingService])
export class GridEditBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
  ) {
    super();
  }

  override register(): void {
    this.actionService.addHandler({
      id: 'data-viewer-undo-redo-handler',
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      actions: [ACTION_UNDO, ACTION_REDO],
      isDisabled: this.isDisabled.bind(this),
      handler: this.handleAction.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'data-viewer-undo-key-binding',
      binding: KEY_BINDING_DATA_VIEWER_CELL_UNDO,
      actions: [ACTION_UNDO],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isBindingApplicable: this.isBindingApplicable.bind(this),
      handler: this.handleAction.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'data-viewer-redo-key-binding',
      binding: KEY_BINDING_DATA_VIEWER_CELL_REDO,
      actions: [ACTION_REDO],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isBindingApplicable: this.isBindingApplicable.bind(this),
      handler: this.handleAction.bind(this),
    });
  }

  private isDisabled(context: IDataContextProvider): boolean {
    return !this.getGridEditAction(context);
  }

  private isBindingApplicable(context: IDataContextProvider): boolean {
    return !!this.getGridEditAction(context);
  }

  private handleAction(context: IDataContextProvider, action: IAction): void {
    const editAction = this.getGridEditAction(context);
    if (!editAction) {
      return;
    }

    if (action === ACTION_UNDO) {
      editAction.undoSelectedCellValue();
    }

    if (action === ACTION_REDO) {
      editAction.redoSelectedCellValue();
    }
  }

  private getGridEditAction(context: IDataContextProvider): GridEditAction | null {
    const model = context.get(DATA_CONTEXT_DV_DDM)!;
    const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
    const result = model.source.getResult(resultIndex);

    if (!result) {
      return null;
    }

    const editAction = model.source.tryGetAction(result, IDatabaseDataEditAction);

    if (!editAction || !(editAction instanceof GridEditAction)) {
      return null;
    }

    const selectAction = model.source.tryGetAction(result, IDatabaseDataSelectAction);

    if (!selectAction || !selectAction.getFocusedElement()) {
      return null;
    }

    return editAction;
  }
}
