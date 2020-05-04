/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import {
  CachedResource, GraphQLService, DataTransferProcessorInfo, DataTransferParameters
} from '@dbeaver/core/sdk';
import { Deferred } from '@dbeaver/core/utils';

import { ExportFromContainerProcess } from './ExportFromContainerProcess';
import { ExportFromResultsProcess } from './ExportFromResultsProcess';

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
  private exportProcesses = new Map<string, Deferred<string>>();

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService
  ) { }

  async cancel(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    process.cancel();
  }

  async delete(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    const dataFileId = process.getPayload();
    if (!dataFileId) {
      return;
    }
    try {
      await this.graphQLService.gql.removeDataTransferFile({ dataFileId });
      this.exportProcesses.delete(exportId);
    } catch (e) {
    }
  }

  download(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    const dataFileId = process.getPayload();
    if (!dataFileId) {
      return;
    }
    this.exportProcesses.delete(exportId);
    return `/dbeaver/data/${dataFileId}`;
  }

  async exportFromContainer(
    connectionId: string,
    containerNodePath: string,
    parameters: DataTransferParameters
  ): Promise<string | undefined> {
    const process = new ExportFromContainerProcess(this.graphQLService, this.notificationService);
    const taskId = await process.start(connectionId, containerNodePath, parameters);
    if (taskId) {
      this.exportProcesses.set(taskId, process);
      // this.notificationService.logInfo({ title: 'We prepare your file for export. Please wait' });
      await process.promise;
      window.open(this.download(taskId), '_blank');
      return taskId;
    }
  }

  async exportFromResults(
    connectionId: string,
    contextId: string,
    resultsId: string,
    parameters: DataTransferParameters
  ): Promise<string | undefined> {
    const process = new ExportFromResultsProcess(this.graphQLService, this.notificationService);
    const taskId = await process.start(connectionId, contextId, resultsId, parameters);
    if (taskId) {
      this.exportProcesses.set(taskId, process);
      await process.promise;
      window.open(this.download(taskId), '_blank');
      return taskId;
    }
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
