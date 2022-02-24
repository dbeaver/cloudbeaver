/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ResultDataFormat } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';

export interface IDataTableActions {
  presentationId: string | undefined;
  valuePresentationId: string | null | undefined;
  dataModel: IDatabaseDataModel<any, any> | undefined;

  setPresentation: (id: string) => void;
  setValuePresentation: (id: string | null) => void;
  switchValuePresentation: (id: string | null) => void;
  closeValuePresentation: () => void;
}

export interface IDataTableActionsPrivate extends IDataTableActions {
  resultIndex: number;
  dataFormat: ResultDataFormat;
  onPresentationChange: (id: string) => void;
  onValuePresentationChange: (id: string | null) => void;
}
