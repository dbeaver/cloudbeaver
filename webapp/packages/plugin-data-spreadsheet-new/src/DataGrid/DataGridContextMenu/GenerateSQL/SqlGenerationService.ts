/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, SqlResultSetGeneratorId, type SqlResultRow } from '@cloudbeaver/core-sdk';
import type { IDatabaseDataModel, ResultSetDataSource } from '@cloudbeaver/plugin-data-viewer';

@injectable(() => [NotificationService, GraphQLService])
export class SqlGenerationService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly graphQLService: GraphQLService,
  ) {}

  async generateSql(
    model: IDatabaseDataModel<ResultSetDataSource>,
    resultIndex: number,
    generatorId: SqlResultSetGeneratorId,
    rows: SqlResultRow[],
  ): Promise<string | null> {
    const result = model.source.getResult(resultIndex);
    const executionContext = model.source.executionContext?.context;

    if (!result?.id) {
      this.notificationService.logError({
        title: 'data_grid_table_generate_sql_error_title',
        message: 'data_grid_table_generate_sql_error_no_result',
        isSilent: false,
      });
      return null;
    }

    if (!executionContext) {
      this.notificationService.logError({
        title: 'data_grid_table_generate_sql_error_title',
        message: 'data_grid_table_generate_sql_error_no_context',
        isSilent: false,
      });
      return null;
    }

    const response = await this.graphQLService.sdk.sqlGenerateResultSetQuery({
      projectId: executionContext.projectId,
      connectionId: executionContext.connectionId,
      contextId: executionContext.id,
      generatorId,
      resultsId: result.id,
      selectedRows: rows,
    });

    return response.sqlGenerateResultSetQuery;
  }
}
