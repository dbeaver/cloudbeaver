/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ResultSetDataContentManager, ResultSetDataKeysUtils } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

@injectable()
export class DataGridContextMenuSaveContentService {
  private static readonly menuContentSaveToken = 'menuContentSave';

  constructor(
    private readonly dataGridContextMenuService: DataGridContextMenuService,
    private readonly notificationService: NotificationService
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
          const manager = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataContentManager);
          try {
            await manager.downloadFileData(context.data.key);
          } catch (exception: any) {
            this.notificationService.logException(exception, 'data_grid_table_context_menu_save_value_error');
          }
        },
        isHidden: context => {
          const manager = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataContentManager);
          return !manager.isDownloadable(context.data.key);
        },
        isDisabled: context => {
          const manager = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataContentManager);

          return context.data.model.isLoading() || (
            !!manager.activeElement && ResultSetDataKeysUtils.isElementsKeyEqual(
              context.data.key, manager.activeElement
            )
          );
        },
      }
    );
  }
}
