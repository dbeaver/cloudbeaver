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

import { DataModelWrapper } from '../../DataModelWrapper';

@injectable()
export class TableFooterMenuService {

  static nodeContextType = 'NodeWithParent';
  private tableFooterMenuToken = 'tableFooterMenu';

  constructor(private contextMenuService: ContextMenuService) {
    this.contextMenuService.addPanel(this.tableFooterMenuToken);

    this.registerMenuItem({
      id: 'save ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isDisabled(context) {
        return !context.data.deprecatedModel.isEdited();
      },
      order: 1,
      title: 'ui_processing_save',
      icon: 'table-save',
      onClick: context => context.data.deprecatedModel.saveChanges(),
    });
    this.registerMenuItem({
      id: 'cancel ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      isDisabled(context) {
        return !context.data.deprecatedModel.isEdited();
      },
      order: 2,
      title: 'ui_processing_cancel',
      icon: 'table-cancel',
      onClick: context => context.data.deprecatedModel.cancelChanges(),
    });
  }

  constructMenuWithContext(model: DataModelWrapper): IMenuItem[] {
    const context: IMenuContext<DataModelWrapper> = {
      menuId: this.tableFooterMenuToken,
      contextId: model.id,
      contextType: TableFooterMenuService.nodeContextType,
      data: model,
    };
    return this.contextMenuService.createContextMenu(context, this.tableFooterMenuToken).menuItems;
  }

  registerMenuItem(options: IContextMenuItem<DataModelWrapper>): void {
    this.contextMenuService.addMenuItem<DataModelWrapper>(this.tableFooterMenuToken, options);
  }
}
