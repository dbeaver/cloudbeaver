/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IContextMenuItem, IMenuPanel } from '@cloudbeaver/core-dialogs';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import type { IDatabaseDataModel, IDataPresentationActions, IDataTableActions, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridCellMenuContext {
  model: IDatabaseDataModel<any>;
  actions: IDataTableActions;
  spreadsheetActions: IDataPresentationActions<IResultSetElementKey>;
  resultIndex: number;
  key: IResultSetElementKey;
}

@injectable()
export class DataGridContextMenuService {
  onRootMenuOpen: IExecutor<IDataGridCellMenuContext>;
  static cellContext = 'data-grid-cell-context-menu';
  private static menuToken = 'dataGridCell';

  constructor(
    private contextMenuService: ContextMenuService,
  ) {
    this.onRootMenuOpen = new Executor();
  }

  getMenuToken(): string {
    return DataGridContextMenuService.menuToken;
  }

  constructMenuWithContext(
    model: IDatabaseDataModel<any>,
    actions: IDataTableActions,
    spreadsheetActions: IDataPresentationActions<IResultSetElementKey>,
    resultIndex: number,
    key: IResultSetElementKey
  ): IMenuPanel {
    return this.contextMenuService.createContextMenu<IDataGridCellMenuContext>({
      menuId: this.getMenuToken(),
      contextType: DataGridContextMenuService.cellContext,
      data: { model, actions, spreadsheetActions, resultIndex, key },
    }, this.getMenuToken());
  }

  openMenu(
    model: IDatabaseDataModel<any>,
    actions: IDataTableActions,
    spreadsheetActions: IDataPresentationActions<IResultSetElementKey>,
    resultIndex: number,
    key: IResultSetElementKey
  ): void {
    this.onRootMenuOpen.execute({ model, actions, spreadsheetActions, resultIndex, key });
  }

  add(panelId: string, menuItem: IContextMenuItem<IDataGridCellMenuContext>): void {
    this.contextMenuService.addMenuItem(panelId, menuItem);
  }

  register(): void { }
}
