/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, observable, toJS } from 'mobx';

import { IProperty, useObservableRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DataTransferOutputSettings, DataTransferProcessorInfo } from '@cloudbeaver/core-sdk';

import { DataExportService } from '../DataExportService';
import { DataTransferProcessorsResource } from '../DataTransferProcessorsResource';
import type { IExportContext } from '../IExportContext';
import { DefaultExportOutputSettingsResource } from './DefaultExportOutputSettingsResource';
import { EDataExportStep } from './EDataExportStep';

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
        this.processor = await this.dataTransferProcessorsResource.load(processorId);
        const outputData = await defaultExportOutputSettingsResource.load();

        if (outputData) {
          this.outputSettings = toJS(outputData.outputSettings);
        }

        this.processorProperties = {};
        this.setStep(EDataExportStep.Configure);
        this.exception = null;
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
            outputSettings: this.outputSettings,
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
    { context, onExport, dataExportService, defaultExportOutputSettingsResource, dataTransferProcessorsResource },
  );

  return state;
}
