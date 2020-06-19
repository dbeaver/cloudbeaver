/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import {
  ContextMenuService, IMenuContext, IContextMenuItem, IMenuItem
} from '@cloudbeaver/core-dialogs';

import { TableViewerModel } from '../../TableViewerModel';

@injectable()
export class TableFooterMenuService {

  static nodeContextType = 'NodeWithParent';
  private tableFooterMenuToken = 'tableFooterMenu';

  constructor(private contextMenuService: ContextMenuService) {
    this.contextMenuService.addPanel(this.tableFooterMenuToken);
  }

  constructMenuWithContext(model: TableViewerModel): IMenuItem[] {
    const context: IMenuContext<TableViewerModel> = {
      menuId: this.tableFooterMenuToken,
      contextId: model.tableId,
      contextType: TableFooterMenuService.nodeContextType,
      data: model,
    };
    return this.contextMenuService.createContextMenu(context, this.tableFooterMenuToken).menuItems;
  }

  registerMenuItem(options: IContextMenuItem<TableViewerModel>): void {
    this.contextMenuService.addMenuItem<TableViewerModel>(this.tableFooterMenuToken, options);
  }
}
