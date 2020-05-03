/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { IProperty } from '@dbeaver/core/blocks';
import { injectable, IInitializableController } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { DataTransferProcessorInfo } from '@dbeaver/core/sdk';

import { DataExportService } from '../DataExportService';
import { IExportContext } from '../IExportContext';

export enum DataExportStep {
  DataTransferProcessor,
  Configure
}

@injectable()
export class DataExportController implements IInitializableController {
  @observable step = DataExportStep.DataTransferProcessor
  get isLoading() {
    return !this.dataExportService.processors.isLoaded();
  }
  @observable processor: DataTransferProcessorInfo | null = null

  @computed get processors(): DataTransferProcessorInfo[] {
    return Array
      .from(
        this.dataExportService.processors.data.values()
      )
      .sort((a, b) => this.sortProcessors(a, b));
  }

  @observable readonly processorProperties: any = {}
  @observable properties: IProperty[] = []

  private context!: IExportContext;

  constructor(
    private dataExportService: DataExportService,
    private notificationService: NotificationService
  ) { }

  init(context: IExportContext) {
    this.context = context;
    this.loadProcessors();
  }

  export = () => {
    if (!this.processor) {
      return;
    }

    if (this.context.containerNodePath) {
      this.dataExportService.exportFromContainer(
        this.context.connectionId,
        this.context.containerNodePath,
        {
          processorId: this.processor.id,
          processorProperties: this.processorProperties,
        }
      );
    } else if (this.context.contextId && this.context.resultId) {
      this.dataExportService.exportFromResults(
        this.context.connectionId,
        this.context.contextId,
        this.context.resultId,
        {
          processorId: this.processor.id,
          processorProperties: this.processorProperties,
        }
      );
    }
  }

  setStep = (step: DataExportStep) => {
    this.step = step;
  }

  selectProcessor = (processorId: string) => {
    this.processor = this.dataExportService
      .processors
      .data
      .get(processorId)!;

    this.properties = this.processor.properties?.map(property => ({
      id: property.displayName!,
      name: property.displayName!,
      description: property.description,
      validValues: property.validValues,
    })) || [];
    this.step = DataExportStep.Configure;
  }

  private async loadProcessors() {
    try {
      await this.dataExportService.processors.load();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load data export processors');
    }
  }

  private sortProcessors(processorA: DataTransferProcessorInfo, processorB: DataTransferProcessorInfo): number {
    if (processorA.order === processorB.order)
    {
      return (processorA.name || '').localeCompare((processorB.name || ''));
    }

    return (processorB.order || 0) - (processorA.order || 0);
  }
}
