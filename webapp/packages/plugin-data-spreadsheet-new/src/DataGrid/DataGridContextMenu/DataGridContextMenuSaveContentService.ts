/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { selectFiles } from '@cloudbeaver/core-browser';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ACTION_DOWNLOAD, ACTION_UPLOAD, ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  createResultSetBlobValue,
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_RESULT_KEY,
  DatabaseEditChangeType,
  DataViewerService,
  isResultSetDataSource,
  ResultSetDataContentAction,
  ResultSetDataSource,
  ResultSetEditAction,
  ResultSetFormatAction,
} from '@cloudbeaver/plugin-data-viewer';

@injectable()
export class DataGridContextMenuSaveContentService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataViewerService: DataViewerService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {}

  register(): void {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        return isResultSetDataSource(model.source);
      },
      getItems: (context, items) => [...items, ACTION_UPLOAD, ACTION_DOWNLOAD],
    });

    this.actionService.addHandler({
      id: 'data-grid-save-content-handler',
      actions: [ACTION_UPLOAD, ACTION_DOWNLOAD],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX, DATA_CONTEXT_DV_RESULT_KEY],
      isHidden: (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const content = source.getAction(resultIndex, ResultSetDataContentAction);
        const format = source.getAction(resultIndex, ResultSetFormatAction);
        const editor = source.getAction(resultIndex, ResultSetEditAction);

        if (action === ACTION_DOWNLOAD) {
          return !content.isDownloadable(key) || !this.dataViewerService.canExportData;
        }

        if (action === ACTION_UPLOAD) {
          return (
            !format.isBinary(key) ||
            model.isReadonly(resultIndex) ||
            (format.isReadOnly(key) && editor.getElementState(key) !== DatabaseEditChangeType.add)
          );
        }

        return true;
      },
      isDisabled(context, action) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const content = source.getAction(resultIndex, ResultSetDataContentAction);

        if (action === ACTION_DOWNLOAD || action === ACTION_UPLOAD) {
          return model.isLoading() || content.isLoading(key);
        }

        return false;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const key = context.get(DATA_CONTEXT_DV_RESULT_KEY)!;

        const source = model.source as unknown as ResultSetDataSource;
        const content = source.getAction(resultIndex, ResultSetDataContentAction);
        const edit = source.getAction(resultIndex, ResultSetEditAction);

        if (action === ACTION_DOWNLOAD) {
          try {
            await content.downloadFileData(key);
          } catch (exception: any) {
            this.notificationService.logException(exception, 'data_grid_table_context_menu_save_value_error');
          }
        }

        if (action === ACTION_UPLOAD) {
          selectFiles(files => {
            const file = files?.[0] ?? undefined;
            if (file) {
              edit.set(key, createResultSetBlobValue(file));
            }
          });
        }
      },
    });
  }
}
