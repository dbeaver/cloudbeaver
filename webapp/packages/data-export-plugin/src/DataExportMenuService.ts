/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { IContextMenuItem, IMenuContext, CommonDialogService } from '@dbeaver/core/dialogs';
import { TableFooterMenuService, TableViewerModel } from '@dbeaver/data-viewer-plugin';

import { DataExportDialog } from './Dialog/DataExportDialog';


@injectable()
export class DataExportMenuService {
  constructor(
    private commonDialogService: CommonDialogService,
    private tableFooterMenuService: TableFooterMenuService,
  ) { }

  register() {
    const exportData: IContextMenuItem<TableViewerModel> = {
      id: 'export ',
      isPresent(context) {
        return context.contextType === TableFooterMenuService.nodeContextType;
      },
      order: 1,
      title: 'Export',
      icon: 'export',
      onClick: this.exportData.bind(this),
    };
    this.tableFooterMenuService.registerMenuItem(exportData);
  }

  private exportData(context: IMenuContext<TableViewerModel>) {
    this.commonDialogService.open(DataExportDialog, {
      connectionId: context.data.connectionId,
      contextId: context.data.executionContext?.contextId,
      containerNodePath: context.data.containerNodePath,
      resultId: context.data.resultId,
      sourceName: context.data.sourceName,
    });
  }
}
