/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { HTMLAttributes } from 'react';

import { injectable } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';
import type { TabProps } from '@cloudbeaver/core-ui';

import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel.js';
import type { IDataTableActions } from './TableViewer/IDataTableActions.js';

export interface IDataPresentationProps extends HTMLAttributes<HTMLDivElement> {
  dataFormat: ResultDataFormat;
  model: IDatabaseDataModel;
  actions: IDataTableActions;
  resultIndex: number;
  simple: boolean;
  className?: string;
}

export enum DataPresentationType {
  main,
  toolsPanel,
}

export type DataPresentationComponent = React.FunctionComponent<IDataPresentationProps>;

export type PresentationTabProps = TabProps & {
  presentation: IDataPresentationOptions;
  model: IDatabaseDataModel;
};

export type PresentationTabComponent = React.FunctionComponent<PresentationTabProps>;

export interface IDataPresentationOptions {
  id: string;
  dataFormat?: ResultDataFormat;
  type?: DataPresentationType;
  title?: string;
  icon?: string;
  hidden?: (dataFormat: ResultDataFormat | null, model: IDatabaseDataModel, resultIndex: number) => boolean;
  getPresentationComponent: () => DataPresentationComponent;
  getTabComponent?: () => PresentationTabComponent;
  onActivate?: () => void;
}

export interface IDataPresentation extends IDataPresentationOptions {
  type: DataPresentationType;
}

@injectable()
export class DataPresentationService {
  private readonly dataPresentations: Map<string, IDataPresentation>;

  constructor() {
    this.dataPresentations = new Map();
  }

  get(id: string): IDataPresentation | undefined {
    return this.dataPresentations.get(id);
  }

  getSupportedList(
    type: DataPresentationType,
    supportedDataFormats: ResultDataFormat[],
    dataFormat: ResultDataFormat,
    model: IDatabaseDataModel,
    resultIndex: number,
  ): IDataPresentation[] {
    return Array.from(this.dataPresentations.values()).filter(presentation => {
      if (presentation.dataFormat !== undefined && !supportedDataFormats.includes(presentation.dataFormat)) {
        return false;
      }

      if (presentation.type !== type || presentation.hidden?.(dataFormat, model, resultIndex)) {
        return false;
      }

      return true;
    });
  }

  getSupported(
    type: DataPresentationType,
    dataFormat: ResultDataFormat,
    presentationId: string | undefined,
    model: IDatabaseDataModel,
    resultIndex: number,
  ): IDataPresentation | null {
    if (presentationId) {
      const presentation = this.dataPresentations.get(presentationId);

      if (presentation) {
        if (presentation.hidden?.(dataFormat, model, resultIndex)) {
          return null;
        }
        return presentation;
      }
    }

    for (const presentation of this.dataPresentations.values()) {
      if (
        (presentation.dataFormat === undefined || presentation.dataFormat === dataFormat) &&
        presentation.type === type &&
        !presentation.hidden?.(dataFormat, model, resultIndex)
      ) {
        return presentation;
      }
    }

    return null;
  }

  add(options: IDataPresentationOptions): void {
    this.dataPresentations.set(options.id, {
      ...options,
      type: options.type || DataPresentationType.main,
    });
  }
}
