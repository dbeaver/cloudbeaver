/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, DataTransferParameters } from '@cloudbeaver/core-sdk';
import { Deferred, GlobalConstants, OrderedMap } from '@cloudbeaver/core-utils';

import { ExportFromContainerProcess } from './ExportFromContainerProcess';
import { ExportFromResultsProcess } from './ExportFromResultsProcess';
import type { IExportContext } from './IExportContext';

interface Process {
  taskId: string;
  process: Deferred<string>;
}

export interface ExportProcess {
  taskId: string;
  context: IExportContext;
  parameters: DataTransferParameters;
  process: Deferred<string>;
}

@injectable()
export class DataExportProcessService {
  readonly exportProcesses = new OrderedMap<string, ExportProcess>(value => value.taskId);

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly notificationService: NotificationService
  ) { }

  async cancel(exportId: string): Promise<void> {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    process.process.cancel();
  }

  async delete(exportId: string): Promise<void> {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    try {
      const dataFileId = process.process.getPayload();
      if (dataFileId) {
        await this.graphQLService.sdk.removeDataTransferFile({ dataFileId });
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Error occurred while deleting file');
    } finally {
      this.exportProcesses.remove(exportId);
    }
  }

  download(exportId: string): void {
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

  downloadUrl(exportId: string): string | undefined {
    const process = this.exportProcesses.get(exportId);
    if (!process) {
      return;
    }
    const dataFileId = process.process.getPayload();
    if (!dataFileId) {
      return;
    }
    return GlobalConstants.absoluteServiceUrl('/data/', dataFileId);
  }

  async exportData(
    context: IExportContext,
    parameters: DataTransferParameters
  ): Promise<string> {
    let process: Process | undefined;

    if (context.contextId && context.resultId) {
      process = await this.exportFromResults(context.connectionKey, context.contextId, context.resultId, parameters);
    } else if (context.containerNodePath) {
      process = await this.exportFromContainer(context.connectionKey, context.containerNodePath, parameters);
    }

    if (!process) {
      throw new Error('Context data must be provided');
    }

    this.exportProcesses.addValue({
      ...process,
      context,
      parameters,
    });

    return process.taskId;
  }

  private async exportFromContainer(
    connectionKey: IConnectionInfoParams,
    containerNodePath: string,
    parameters: DataTransferParameters
  ): Promise<Process> {
    const process = new ExportFromContainerProcess(this.graphQLService, this.notificationService);
    const taskId = await process.start(connectionKey, containerNodePath, parameters);
    return { taskId, process };
  }

  private async exportFromResults(
    connectionKey: IConnectionInfoParams,
    contextId: string,
    resultsId: string,
    parameters: DataTransferParameters
  ): Promise<Process> {
    const process = new ExportFromResultsProcess(this.graphQLService, this.notificationService);
    const taskId = await process.start(connectionKey, contextId, resultsId, parameters);

    return { taskId, process };
  }
}
