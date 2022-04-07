/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { download } from '@cloudbeaver/core-utils';
import { DataViewerContentSaverService } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

@injectable()
export class DataGridContextMenuSaveContentService {
  private static readonly menuContentSaveToken = 'menuContentSave';

  constructor(
    private readonly dataGridContextMenuService: DataGridContextMenuService,
    private readonly dataViewerContentSaverService: DataViewerContentSaverService
  ) { }

  getMenuContentSaveToken(): string {
    return DataGridContextMenuSaveContentService.menuContentSaveToken;
  }

  register(): void {
    this.dataGridContextMenuService.add(
      this.dataGridContextMenuService.getMenuToken(),
      {
        id: this.getMenuContentSaveToken(),
        order: 4,
        title: 'ui_processing_save',
        icon: '/icons/save.svg',
        isPresent(context) {
          return context.contextType === DataGridContextMenuService.cellContext;
        },
        onClick: async context => {
          const url = await this.dataViewerContentSaverService.getElementValueURL(
            context.data.model,
            context.data.resultIndex,
            context.data.key
          );

          if (url) {
            download(url);
          }
        },
        isHidden: context => !this.dataViewerContentSaverService.canSaveElementValue(
          context.data.model,
          context.data.resultIndex,
          context.data.key
        ),
      }
    );
  }
}
