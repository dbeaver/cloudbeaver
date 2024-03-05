/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IContextMenuItem, IMenuPanel } from '@cloudbeaver/core-dialogs';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';
import type { IDatabaseDataModel, IDataPresentationActions, IDataTableActions, IResultSetElementKey } from '@cloudbeaver/plugin-data-viewer';

export interface IDataGridCellMenuContext {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  spreadsheetActions: IDataPresentationActions<IResultSetElementKey>;
  resultIndex: number;
  key: IResultSetElementKey;
  simple: boolean;
}

@injectable()
export class DataGridContextMenuService {
  onRootMenuOpen: IExecutor<IDataGridCellMenuContext>;
  static cellContext = 'data-grid-cell-context-menu';
  private static readonly menuToken = 'dataGridCell';

  constructor(private readonly contextMenuService: ContextMenuService) {
    this.onRootMenuOpen = new Executor();
  }

  getMenuToken(): string {
    return DataGridContextMenuService.menuToken;
  }

  constructMenuWithContext(
    model: IDatabaseDataModel,
    actions: IDataTableActions,
    spreadsheetActions: IDataPresentationActions<IResultSetElementKey>,
    resultIndex: number,
    key: IResultSetElementKey,
    simple: boolean,
  ): IMenuPanel {
    return this.contextMenuService.createContextMenu<IDataGridCellMenuContext>(
      {
        menuId: this.getMenuToken(),
        contextType: DataGridContextMenuService.cellContext,
        data: { model, actions, spreadsheetActions, resultIndex, key, simple },
      },
      this.getMenuToken(),
    );
  }

  openMenu(
    model: IDatabaseDataModel,
    actions: IDataTableActions,
    spreadsheetActions: IDataPresentationActions<IResultSetElementKey>,
    resultIndex: number,
    key: IResultSetElementKey,
    simple: boolean,
  ): void {
    this.onRootMenuOpen.execute({ model, actions, spreadsheetActions, resultIndex, key, simple });
  }

  add(panelId: string, menuItem: IContextMenuItem<IDataGridCellMenuContext>): void {
    this.contextMenuService.addMenuItem(panelId, menuItem);
  }

  register(): void {}
}
