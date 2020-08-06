/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed } from 'mobx';

import { IProperty } from '@cloudbeaver/core-blocks';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { DataTransferProcessorInfo, GQLErrorCatcher } from '@cloudbeaver/core-sdk';

import { DataExportService } from '../DataExportService';
import { IExportContext } from '../IExportContext';

export enum DataExportStep {
  DataTransferProcessor,
  Configure
}

@injectable()
export class DataExportController implements IInitializableController, IDestructibleController {
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
      .sort(sortProcessors);
  }

  @observable processorProperties: any = {}
  @observable properties: IProperty[] = []

  readonly error = new GQLErrorCatcher();

  private context!: IExportContext;
  private close!: () => void;
  private isDistructed = false;

  constructor(
    private dataExportService: DataExportService,
    private notificationService: NotificationService,
    private commonDialogService: CommonDialogService
  ) { }

  init(context: IExportContext, close: () => void) {
    this.context = context;
    this.close = close;
    this.loadProcessors();
  }

  destruct(): void {
    this.isDistructed = true;
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
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Can\'t export');
      }
    } finally {
      this.isExporting = false;
      this.close();
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
    this.error.clear();
  }

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  }

  private async loadProcessors() {
    try {
      await this.dataExportService.processors.load(null);
    } catch (exception) {
      this.notificationService.logException(exception, 'Can\'t load data export processors');
    }
  }
}

function sortProcessors(processorA: DataTransferProcessorInfo, processorB: DataTransferProcessorInfo): number {
  if (processorA.order === processorB.order)
  {
    return (processorA.name || '').localeCompare((processorB.name || ''));
  }

  return processorA.order - processorB.order;
}
