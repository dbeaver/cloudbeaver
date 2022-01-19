/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { DataTransferParameters } from '@cloudbeaver/core-sdk';

import { DataExportProcessService } from './DataExportProcessService';
import { DataTransferProcessorsResource } from './DataTransferProcessorsResource';
import { ExportNotification } from './ExportNotification/ExportNotification';
import type { IExportContext } from './IExportContext';

@injectable()
export class DataExportService {
  constructor(
    private notificationService: NotificationService,
    private dataExportProcessService: DataExportProcessService,
    readonly processors: DataTransferProcessorsResource
  ) { }

  async cancel(exportId: string): Promise<void> {
    await this.dataExportProcessService.cancel(exportId);
  }

  async delete(exportId: string): Promise<void> {
    await this.dataExportProcessService.delete(exportId);
  }

  download(exportId: string): void {
    this.dataExportProcessService.download(exportId);
  }

  async exportData(
    context: IExportContext,
    parameters: DataTransferParameters
  ): Promise<string> {
    const taskId = await this.dataExportProcessService.exportData(
      context,
      parameters
    );

    this.notificationService.customNotification(() => ExportNotification, { source: taskId });
    return taskId;
  }
}
