/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, computed, makeObservable } from 'mobx';

import type { IProperty } from '@cloudbeaver/core-blocks';
import { injectable, IInitializableController, IDestructibleController } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ErrorDetailsDialog } from '@cloudbeaver/core-notifications';
import { DataTransferProcessorInfo, GQLErrorCatcher } from '@cloudbeaver/core-sdk';

import { DataExportService } from '../DataExportService';
import type { IExportContext } from '../IExportContext';

export enum DataExportStep {
  DataTransferProcessor,
  Configure
}

@injectable()
export class DataExportController implements IInitializableController, IDestructibleController {
  step = DataExportStep.DataTransferProcessor;
  get isLoading(): boolean {
    return this.dataExportService.processors.isLoading();
  }

  isExporting = false;
  processor: DataTransferProcessorInfo | null = null;

  get processors(): DataTransferProcessorInfo[] {
    return Array
      .from(
        this.dataExportService.processors.data.values()
      )
      .sort(sortProcessors);
  }

  processorProperties: any = {};
  properties: IProperty[] = [];

  readonly error = new GQLErrorCatcher();

  private context!: IExportContext;
  private close!: () => void;
  private isDistructed = false;

  constructor(
    private readonly dataExportService: DataExportService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService
  ) {
    makeObservable(this, {
      step: observable,
      isExporting: observable,
      processor: observable,
      processors: computed,
      processorProperties: observable,
      properties: observable,
    });
  }

  init(context: IExportContext, close: () => void): void {
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
          filter: this.context.filter,
        }
      );
      this.close();
    } catch (exception: any) {
      if (!this.error.catch(exception) || this.isDistructed) {
        this.notificationService.logException(exception, 'Can\'t export');
      }
    } finally {
      this.isExporting = false;
      this.close();
    }
  };

  setStep = (step: DataExportStep) => {
    this.step = step;
  };

  selectProcessor = (processorId: string) => {
    this.processor = this.dataExportService
      .processors
      .data
      .get(processorId)!;

    this.properties = this.processor.properties?.map<IProperty>(property => ({
      id: property.id!,
      key: property.id!,
      displayName: property.displayName,
      description: property.description,
      validValues: property.validValues,
      defaultValue: property.defaultValue,
      valuePlaceholder: property.defaultValue,
    })) || [];

    this.processorProperties = {};

    this.step = DataExportStep.Configure;
    this.error.clear();
  };

  showDetails = () => {
    if (this.error.exception) {
      this.commonDialogService.open(ErrorDetailsDialog, this.error.exception);
    }
  };

  private async loadProcessors() {
    try {
      await this.dataExportService.processors.load();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Can\'t load data export processors');
    }
  }
}

function sortProcessors(processorA: DataTransferProcessorInfo, processorB: DataTransferProcessorInfo): number {
  if (processorA.order === processorB.order) {
    return (processorA.name || '').localeCompare((processorB.name || ''));
  }

  return processorA.order - processorB.order;
}
