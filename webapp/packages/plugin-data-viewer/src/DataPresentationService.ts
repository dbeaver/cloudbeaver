/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { TabProps } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from './DatabaseDataModel/IDatabaseDataModel';

export interface IDataPresentationProps {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
  className?: string;
}

export type DataPresentationComponent = React.FunctionComponent<IDataPresentationProps>;

export type PresentationTabProps = TabProps & {
  presentation: DataPresentationOptions;
  model: IDatabaseDataModel<any>;
};
export type PresentationTabComponent = React.FunctionComponent<PresentationTabProps>;

export interface DataPresentationOptions {
  id: string;
  dataFormat: ResultDataFormat;
  title?: string;
  icon?: string;
  hidden?: () => boolean;
  getPresentationComponent: () => DataPresentationComponent;
  getTabComponent?: () => PresentationTabComponent;
  onActivate?: () => void;
}

@injectable()
export class DataPresentationService {
  get default(): DataPresentationOptions | undefined {
    return this.dataPresentations.values().next().value;
  }

  private dataPresentations: Map<string, DataPresentationOptions>;

  constructor() {
    this.dataPresentations = new Map();
  }

  get(id: string): DataPresentationOptions | undefined {
    return this.dataPresentations.get(id);
  }

  getSupportedList(dataFormat: ResultDataFormat | ResultDataFormat[]): DataPresentationOptions[] {
    return Array.from(this.dataPresentations.values()).filter(presentation => {
      if (presentation.hidden?.()) {
        return false;
      }

      return presentation.dataFormat === dataFormat || dataFormat.includes(presentation.dataFormat);
    });
  }

  getSupported(dataFormat: ResultDataFormat, presentationId: string | undefined): DataPresentationOptions | null {
    if (presentationId) {
      const presentation = this.dataPresentations.get(presentationId);

      if (presentation) {
        return presentation;
      }
    }

    for (const presentation of this.dataPresentations.values()) {
      if (presentation.dataFormat === dataFormat) {
        return presentation;
      }
    }

    return null;
  }

  add(options: DataPresentationOptions): void {
    this.dataPresentations.set(options.id, options);
  }
}
