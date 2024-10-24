/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { selectFiles } from '@cloudbeaver/core-browser';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  createResultSetBlobValue,
  DataViewerService,
  isResultSetDataSource,
  ResultSetDataContentAction,
  ResultSetDataSource,
  ResultSetEditAction,
  ResultSetFormatAction,
} from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService.js';

@injectable()
export class DataGridContextMenuSaveContentService {
  constructor(
    private readonly dataGridContextMenuService: DataGridContextMenuService,
    private readonly notificationService: NotificationService,
    private readonly dataViewerService: DataViewerService,
  ) {}

  register(): void {
    this.dataGridContextMenuService.add(this.dataGridContextMenuService.getMenuToken(), {
      id: 'menuContentDownload',
      order: 4,
      title: 'ui_download',
      icon: '/icons/export.svg',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      onClick: async context => {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const content = source.getAction(context.data.resultIndex, ResultSetDataContentAction);
        try {
          await content.downloadFileData(context.data.key);
        } catch (exception: any) {
          this.notificationService.logException(exception, 'data_grid_table_context_menu_save_value_error');
        }
      },
      isHidden: context => {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const content = source.getAction(context.data.resultIndex, ResultSetDataContentAction);

        return !content.isDownloadable(context.data.key) || !this.dataViewerService.canExportData;
      },
      isDisabled: context => {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const content = source.getAction(context.data.resultIndex, ResultSetDataContentAction);

        return context.data.model.isLoading() || content.isLoading(context.data.key);
      },
    });
    this.dataGridContextMenuService.add(this.dataGridContextMenuService.getMenuToken(), {
      id: 'menuContentUpload',
      order: 5,
      title: 'ui_upload',
      icon: '/icons/import.svg',
      isPresent(context) {
        return context.contextType === DataGridContextMenuService.cellContext && isResultSetDataSource(context.data.model.source);
      },
      onClick: async context => {
        selectFiles(files => {
          const source = context.data.model.source as unknown as ResultSetDataSource;
          const edit = source.getAction(context.data.resultIndex, ResultSetEditAction);
          const file = files?.[0] ?? undefined;
          if (file) {
            edit.set(context.data.key, createResultSetBlobValue(file));
          }
        });
      },
      isHidden: context => {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const format = source.getAction(context.data.resultIndex, ResultSetFormatAction);

        return !format.isBinary(context.data.key) || context.data.model.isReadonly(context.data.resultIndex);
      },
      isDisabled: context => {
        const source = context.data.model.source as unknown as ResultSetDataSource;
        const content = source.getAction(context.data.resultIndex, ResultSetDataContentAction);

        return context.data.model.isLoading() || content.isLoading(context.data.key);
      },
    });
  }
}
