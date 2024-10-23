/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, type IContextMenuItem, type IMenuPanel } from '@cloudbeaver/core-dialogs';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

import type { IResultSetElementKey } from './DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';
import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataPresentationActions } from './TableViewer/IDataPresentationActions.js';
import type { IDataTableActions } from './TableViewer/IDataTableActions.js';

export interface IDataViewerContextMenu {
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  spreadsheetActions: IDataPresentationActions<IResultSetElementKey>;
  resultIndex: number;
  key: IResultSetElementKey;
  simple: boolean;
}

@injectable()
export class DataViewerContextMenuService {
  onRootMenuOpen: IExecutor<IDataViewerContextMenu>;

  static cellContext = 'data-viewer-cell-context-menu';
  private static readonly menuToken = 'data-viewer-context-menu';

  constructor(private readonly contextMenuService: ContextMenuService) {
    this.onRootMenuOpen = new Executor();
  }

  getMenuToken(): string {
    return DataViewerContextMenuService.menuToken;
  }

  constructMenuWithContext(
    model: IDatabaseDataModel,
    actions: IDataTableActions,
    spreadsheetActions: IDataPresentationActions<IResultSetElementKey>,
    resultIndex: number,
    key: IResultSetElementKey,
    simple: boolean,
  ): IMenuPanel {
    return this.contextMenuService.createContextMenu<IDataViewerContextMenu>(
      {
        menuId: this.getMenuToken(),
        contextType: DataViewerContextMenuService.cellContext,
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

  add(panelId: string, menuItem: IContextMenuItem<IDataViewerContextMenu>): void {
    this.contextMenuService.addMenuItem(panelId, menuItem);
  }
}
