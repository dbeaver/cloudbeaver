/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable, toJS } from 'mobx';

import { type IProperty, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { getObjectPropertyDefaultValue, type DataTransferOutputSettings } from '@cloudbeaver/core-sdk';

import { DataExportService } from '../DataExportService.js';
import { DataTransferProcessorsResource, type IDataTransferProcessorInfo } from '../DataTransferProcessorsResource.js';
import type { IExportContext } from '../IExportContext.js';
import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource.js';
import { EDataExportStep } from './EDataExportStep.js';

interface State {
  readonly properties: IProperty[];
  step: EDataExportStep;
  processor: IDataTransferProcessorInfo | null;
  processorProperties: Record<string, any>;
  outputSettings: Partial<DataTransferOutputSettings>;
  processing: boolean;
  exception: Error | null;
  setStep(step: EDataExportStep): void;
  selectProcessor(processorId: string): Promise<void>;
  export(): Promise<void>;
}

export function useDataExportDialog(contexts: IExportContext[], onExport?: () => void): State {
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

        return this.processor.properties.map(property => {
          const defaultValue = getObjectPropertyDefaultValue(property);

          return {
            id: property.id!,
            key: property.id!,
            displayName: property.displayName,
            description: property.description,
            validValues: property.validValues,
            defaultValue,
            valuePlaceholder: defaultValue,
          };
        });
      },
      step: EDataExportStep.DataTransferProcessor,
      processing: false,
      processor: null as IDataTransferProcessorInfo | null,
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
        const processor = this.processor;

        if (!processor || this.processing) {
          return;
        }

        this.processing = true;
        this.exception = null;

        let started = 0;
        let lastException: any = null;

        try {
          // the server exports one container per task, so every selected object gets its own task and notification
          for (const context of this.contexts) {
            try {
              await this.dataExportService.exportData(context, {
                processorId: processor.id,
                processorProperties: this.processorProperties,
                filter: context.filter,
                outputSettings: {
                  ...this.outputSettings,
                  fileName: context.fileName,
                },
              });

              started++;
            } catch (exception: any) {
              lastException = exception;

              if (this.contexts.length > 1) {
                this.notificationService.logException(exception, 'data_transfer_notification_error');
              }
            }
          }

          if (started > 0) {
            this.onExport?.();
          } else {
            this.exception = lastException;
          }
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
      contexts,
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
