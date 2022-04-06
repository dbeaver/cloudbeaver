/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { download } from '@cloudbeaver/core-utils';
import { isResultSetContentValue, ResultSetDataAction, ResultSetViewAction } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContextMenuService } from './DataGridContextMenuService';

const RESULT_VALUE_URL = '/api/sql-result-value';

@injectable()
export class DataGridContextMenuSaveContentService {
  private static readonly menuContentSaveToken = 'menuContentSave';

  constructor(
    private readonly dataGridContextMenuService: DataGridContextMenuService,
    private readonly graphQLService: GraphQLService
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
          const result = context.data.model.getResult(context.data.resultIndex);
          const data = context.data.model.source.getAction(context.data.resultIndex, ResultSetDataAction);
          const column = data.getColumn(context.data.key.column);
          const row = data.getRowValue(context.data.key.row);

          if (!result?.id || !row || !column) {
            return;
          }

          const response = await this.graphQLService.sdk.readLobValue({
            resultsId: result.id,
            connectionId: result.connectionId,
            contextId: result.contextId,
            lobColumnIndex: String(column.position),
            row: {
              data: row,
            },
          });

          const url = `${RESULT_VALUE_URL}/${response.lobValue}`;
          download(url, '');
        },
        isHidden(context) {
          const view = context.data.model.source.getAction(context.data.resultIndex, ResultSetViewAction);
          const cellValue = view.getCellValue(context.data.key);

          return !isResultSetContentValue(cellValue);
        },
      }
    );
  }
}
