/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import {
  CachedResource, GraphQLService, DataTransferProcessorInfo, DataTransferParameters
} from '@cloudbeaver/core-sdk';

import { DataExportProcessService } from './DataExportProcessService';
import { ExportNotification } from './ExportNotification/ExportNotification';
import { IExportContext } from './IExportContext';

type ProcessorsResourceMetadata = {
  loaded: boolean;
}

@injectable()
export class DataExportService {
  readonly processors = new CachedResource(
    new Map(),
    this.refreshProcessorsAsync.bind(this),
    (_, { loaded }) => loaded
  );

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private dataExportProcessService: DataExportProcessService,
  ) { }

  async cancel(exportId: string) {
    await this.dataExportProcessService.cancel(exportId);
  }

  async delete(exportId: string) {
    await this.dataExportProcessService.delete(exportId);
  }

  download(exportId: string) {
    this.dataExportProcessService.download(exportId);
  }

  downloadUrl(exportId: string) {
    return this.dataExportProcessService.download(exportId);
  }

  async exportData(
    context: IExportContext,
    parameters: DataTransferParameters
  ) {
    const taskId = await this.dataExportProcessService.exportData(
      context,
      parameters
    );

    this.notificationService.customNotification(() => ExportNotification, taskId);
    return taskId;
  }

  private async refreshProcessorsAsync(
    data: Map<string, DataTransferProcessorInfo>,
    metadata: ProcessorsResourceMetadata,
  ): Promise<Map<string, DataTransferProcessorInfo>> {
    const { processors } = await this.graphQLService.gql.getDataTransferProcessors();

    data.clear();

    for (const processor of processors) {
      data.set(processor.id, processor);
    }
    metadata.loaded = true;
    return data;
  }
}
