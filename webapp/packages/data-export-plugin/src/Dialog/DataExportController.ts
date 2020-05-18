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
    return this.dataExportService.processors.isLoading();
  }
  @observable isExporting = false
  @observable processor: DataTransferProcessorInfo | null = null

  @computed get processors(): DataTransferProcessorInfo[] {
    return Array
      .from(
        this.dataExportService.processors.data.values()
      )
      .sort((a, b) => this.sortProcessors(a, b));
  }

  @observable processorProperties: any = {}
  @observable properties: IProperty[] = []

  private context!: IExportContext;
  private close!: () => void;

  constructor(
    private dataExportService: DataExportService,
    private notificationService: NotificationService
  ) { }

  init(context: IExportContext, close: () => void) {
    this.context = context;
    this.close = close;
    this.loadProcessors();
  }

  prepareExport = async () => {
    if (!this.processor || this.isExporting) {
      return;
    }
    this.isExporting = true;

    try {
      await this.dataExportService.exportData(
        this.context,
        {
          processorId: this.processor.id,
          processorProperties: this.processorProperties,
        }
      );
      this.close();
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t export');
    } finally {
      this.isExporting = false;
      close();
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
      id: property.id!,
      key: property.id!,
      displayName: property.displayName!,
      description: property.description,
      validValues: property.validValues,
      defaultValue: property.defaultValue,
    })) || [];

    this.processorProperties = {};

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

    return processorA.order - processorB.order;
  }
}
