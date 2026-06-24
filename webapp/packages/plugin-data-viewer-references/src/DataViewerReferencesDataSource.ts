/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ConnectionExecutionContextService } from '@cloudbeaver/core-connections';
import type { IServiceProvider } from '@cloudbeaver/core-di';
import { AsyncTaskInfoService } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { ContainerDataSource, DatabaseDataFeature, type IDatabaseResultSet, type IDataContainerOptions } from '@cloudbeaver/plugin-data-viewer';

export interface IDataReferencesOptions extends IDataContainerOptions {}

export class DataViewerReferencesDataSource extends ContainerDataSource<IDataReferencesOptions> {
  constructor(
    serviceProvider: IServiceProvider,
    connectionExecutionContextService: ConnectionExecutionContextService,
    graphQLService: GraphQLService,
    asyncTaskInfoService: AsyncTaskInfoService,
  ) {
    super(serviceProvider, graphQLService, asyncTaskInfoService, connectionExecutionContextService);
    this.setFeature(DatabaseDataFeature.References);
  }

  override request(prevResults: IDatabaseResultSet[]): Promise<IDatabaseResultSet[]> {
    return super.request(prevResults);
  }
}
