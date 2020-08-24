/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { ISqlEditorGroupMetadata } from './ISqlEditorGroupMetadata';
import { SQLQueryExecutionProcess } from './SqlResultTabs/SQLQueryExecutionProcess';

@injectable()
export class SqlEditorGroupMetadataService {
  private metadata: MetadataMap<string, ISqlEditorGroupMetadata>

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService
  ) {
    this.metadata = new MetadataMap(this.metadataGetter.bind(this));
  }

  getTabData(resultTabId: string) {
    return this.metadata.get(resultTabId);
  }

  private metadataGetter(resultTabId: string): ISqlEditorGroupMetadata {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const serviceContext = this;

    return {
      async start(context, sqlQueryParams, filter) {
        this.resultDataProcess = new SQLQueryExecutionProcess(
          serviceContext.graphQLService,
          serviceContext.notificationService
        );
        context.setCurrentlyExecutingQuery(this.resultDataProcess);
        this.resultDataProcess.start(sqlQueryParams, filter);

        return this.resultDataProcess;
      },
      resultDataProcess: new SQLQueryExecutionProcess(this.graphQLService, this.notificationService),
    };
  }
}
