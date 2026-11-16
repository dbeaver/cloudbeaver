/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { DataTransferParameters } from '@cloudbeaver/core-sdk';

import { DataExportProcessService } from './DataExportProcessService.js';
import { ExportNotification } from './ExportNotification/ExportNotification.js';
import type { IExportContext } from './IExportContext.js';

export class DataExportServiceImpl {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly dataExportProcessService: DataExportProcessService,
  ) {}

  async cancel(exportId: string): Promise<void> {
    await this.dataExportProcessService.cancel(exportId);
  }

  download(exportId: string): void {
    this.dataExportProcessService.download(exportId);
  }

  async exportData(context: IExportContext, parameters: DataTransferParameters): Promise<string> {
    const taskId = await this.dataExportProcessService.exportData(context, parameters);

    this.notificationService.customNotification(() => ExportNotification, { source: taskId });

    return taskId;
  }
}

export type DataExportService = DataExportServiceImpl;

export class DataExportServiceDI extends Context.Service<DataExportServiceDI, DataExportServiceImpl>()(
  '@cloudbeaver/plugin-data-export/DataExportService#DataExportService',
) {
  static readonly implementation = DataExportServiceImpl;

  static readonly dependencies = () => [NotificationService, DataExportProcessService] as const;
  static readonly make: Effect.Effect<
    DataExportServiceImpl,
    never,
    Context.Service.Identifier<typeof NotificationService> | Context.Service.Identifier<typeof DataExportProcessService>
  > = Effect.gen(function* makeDataExportService() {
    const notificationService = yield* NotificationService;
    const dataExportProcessService = yield* DataExportProcessService;

    return new DataExportServiceImpl(notificationService, dataExportProcessService);
  });
  static readonly layer: Layer.Layer<
    DataExportServiceDI,
    never,
    Context.Service.Identifier<typeof NotificationService> | Context.Service.Identifier<typeof DataExportProcessService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataExportService = DataExportServiceDI;
