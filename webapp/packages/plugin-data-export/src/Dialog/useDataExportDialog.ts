/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable, toJS } from 'mobx';

import { type IProperty, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import type { DataTransferOutputSettings, DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { DataExportService } from '../DataExportService.js';
import { DataTransferProcessorsResource } from '../DataTransferProcessorsResource.js';
import type { IExportContext } from '../IExportContext.js';
import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource.js';
import { EDataExportStep } from './EDataExportStep.js';

interface State {
  readonly properties: IProperty[];
  step: EDataExportStep;
  processor: DataTransferProcessorInfo | null;
  processorProperties: Record<string, any>;
  outputSettings: Partial<DataTransferOutputSettings>;
  processing: boolean;
  exception: Error | null;
  setStep(step: EDataExportStep): void;
  selectProcessor(processorId: string): Promise<void>;
  export(): Promise<void>;
}

export function useDataExportDialog(context: IExportContext, onExport?: () => void) {
  const notificationService = useService(NotificationService);
  const localizationService = useService(LocalizationService);
  const dataExportService = useService(DataExportService);
  const defaultExportOutputSettingsResource = useService(DefaultExportOutputSettingsResource);
  const dataTransferProcessorsResource = useService(DataTransferProcessorsResource);

  const state: State = useObservableRef(
    () => ({
      get properties() {
        if (!this.processor?.properties) {
          return [];
        }

        return this.processor.properties.map(property => ({
          id: property.id!,
          key: property.id!,
          displayName: property.displayName,
          description: property.description,
          validValues: property.validValues,
          defaultValue: property.defaultValue,
          valuePlaceholder: property.defaultValue,
        }));
      },
      step: EDataExportStep.DataTransferProcessor,
      processing: false,
      processor: null as DataTransferProcessorInfo | null,
      processorProperties: {},
      outputSettings: {},
      exception: null,
      setStep(step: EDataExportStep) {
        this.step = step;
      },
      async selectProcessor(processorId: string) {
        try {
          this.processor = await this.dataTransferProcessorsResource.load(processorId);
          const outputData = await this.defaultExportOutputSettingsResource.load();

          if (outputData) {
            this.outputSettings = toJS(outputData.outputSettings);
          }

          this.processorProperties = {};
          this.setStep(EDataExportStep.Configure);
          this.exception = null;
        } catch (exception: any) {
          this.notificationService.logException(exception, this.localizationService.translate('data_transfer_dialog_select_processor_fail'));
        }
      },
      async export() {
        if (!this.processor || this.processing) {
          return;
        }

        this.processing = true;
        this.exception = null;

        try {
          await this.dataExportService.exportData(this.context, {
            processorId: this.processor.id,
            processorProperties: this.processorProperties,
            filter: this.context.filter,
            outputSettings: {
              ...this.outputSettings,
              fileName: this.context.fileName,
            },
          });

          this.onExport?.();
        } catch (exception: any) {
          this.exception = exception;
        } finally {
          this.processing = false;
        }
      },
    }),
    {
      processorProperties: observable,
      outputSettings: observable,
      processor: observable.ref,
      step: observable.ref,
      exception: observable.ref,
      processing: observable.ref,
      properties: computed,
      setStep: action.bound,
      export: action.bound,
      selectProcessor: action.bound,
    },
    {
      context,
      onExport,
      notificationService,
      dataExportService,
      localizationService,
      defaultExportOutputSettingsResource,
      dataTransferProcessorsResource,
    },
  );

  return state;
}
