/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, DataTransferParameters } from '@cloudbeaver/core-sdk';
import { Deferred, OrderedMap } from '@cloudbeaver/core-utils';

import { ExportFromContainerProcess } from './ExportFromContainerProcess';
import { ExportFromResultsProcess } from './ExportFromResultsProcess';
import { IExportContext } from './IExportContext';

type Process = {
  taskId: string;
  process: Deferred<string>;
}

type ExportProcess = {
  taskId: string;
  context: IExportContext;
  parameters: DataTransferParameters;
  process: Deferred<string>;
}

@injectable()
export class DataExportProcessService {
  readonly exportProcesses = new OrderedMap<string, ExportProcess>(value => value.taskId);

  constructor(
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
  ) { }

  async cancel(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    process.process.cancel();
  }

  async delete(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    try {
      const dataFileId = process.process.getPayload();
      if (dataFileId) {
        await this.graphQLService.sdk.removeDataTransferFile({ dataFileId });
      }
    } catch (exception) {
      this.notificationService.logException(exception, 'Error occurred while deleting file');
    } finally {
      this.exportProcesses.remove(exportId);
    }
  }

  download(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    const dataFileId = process.process.getPayload();
    if (!dataFileId) {
      return;
    }
    this.exportProcesses.remove(exportId);
  }

  downloadUrl(exportId: string) {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    const dataFileId = process.process.getPayload();
    if (!dataFileId) {
      return;
    }
    return `/dbeaver/data/${dataFileId}`;
  }

  async exportData(
    context: IExportContext,
    parameters: DataTransferParameters
  ): Promise<string> {
    let process: Process;
    if (context.containerNodePath) {
      process = await this.exportFromContainer(context.connectionId, context.containerNodePath, parameters);
    } else {
      process = await this.exportFromResults(context.connectionId, context.contextId!, context.resultId!, parameters);
    }

    this.exportProcesses.addValue({
      ...process,
      context,
      parameters,
    });

    return process.taskId;
  }

  private async exportFromContainer(
    connectionId: string,
    containerNodePath: string,
    parameters: DataTransferParameters
  ): Promise<Process> {
    const process = new ExportFromContainerProcess(this.graphQLService, this.notificationService);
    const taskId = await process.start(connectionId, containerNodePath, parameters);
    return { taskId, process };
  }

  private async exportFromResults(
    connectionId: string,
    contextId: string,
    resultsId: string,
    parameters: DataTransferParameters
  ): Promise<Process> {
    const process = new ExportFromResultsProcess(this.graphQLService, this.notificationService);
    const taskId = await process.start(connectionId, contextId, resultsId, parameters);

    return { taskId, process };
  }
}
