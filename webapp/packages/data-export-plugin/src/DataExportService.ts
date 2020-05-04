/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ErrorDetailsDialog } from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { CommonDialogService } from '@dbeaver/core/dialogs';
import { NotificationService } from '@dbeaver/core/eventsLog';
import {
  CachedResource, GraphQLService, DataTransferProcessorInfo, DataTransferParameters
} from '@dbeaver/core/sdk';
import { Deferred } from '@dbeaver/core/utils';

import { ExportFromContainerProcess } from './ExportFromContainerProcess';
import { ExportFromResultsProcess } from './ExportFromResultsProcess';
import { PendingNotification } from './PendingNotification';

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
  readonly exportProcesses = new Map<string, Deferred<string>>();

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService,
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
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while deleting file');
    }
  }

  async showDetails(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    try {
      await this.commonDialogService.open(ErrorDetailsDialog, process.getRejectionReason());
    } finally {
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
  }

  downloadUrl(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    const dataFileId = process.getPayload();
    if (!dataFileId) {
      return;
    }
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
      this.showPendingNotification(taskId);
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
      this.showPendingNotification(taskId);
      return taskId;
    }
  }

  private showPendingNotification(taskId: string) {
    this.notificationService.logInfo({
      title: 'We prepare your file for export. Please wait',
      source: taskId,
      customComponent: () => PendingNotification,
    });
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
