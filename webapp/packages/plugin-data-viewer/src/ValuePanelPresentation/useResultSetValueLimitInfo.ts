/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { QuotasService } from '@cloudbeaver/core-root';

import type { IResultSetElementKey } from '../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import { isResultSetBinaryFileValue } from '../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryFileValue';
import { useResultActions } from '../DatabaseDataModel/Actions/ResultSet/useResultActions';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../DatabaseDataModel/IDatabaseResultSet';
import { isImageValuePresentationAvailable } from './ImageValue/isImageValuePresentationAvailable';

interface IArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  elementKey?: IResultSetElementKey;
}

interface IResultSetLimitInfo {
  limit?: number;
  shouldShowLimit: boolean;
}

export function useResultSetValueLimitInfo({ resultIndex, model, elementKey }: IArgs) {
  const { formatAction, dataAction } = useResultActions({ model, resultIndex });
  const columnType = elementKey ? dataAction.getColumn(elementKey.column)?.dataKind : null;
  const isTextColumn = columnType?.toLocaleLowerCase() === 'string';
  const resultSetValue = elementKey ? formatAction.get(elementKey) : null;
  const isBlob = isResultSetBinaryFileValue(resultSetValue);
  const isImage = isImageValuePresentationAvailable(resultSetValue);
  const quotasService = useService(QuotasService);
  const result: IResultSetLimitInfo = {
    limit: undefined,
    shouldShowLimit: false,
  };

  if (isTextColumn) {
    result.limit = quotasService.getQuota('sqlTextPreviewMaxLength');
    result.shouldShowLimit = true;
  }

  if (isImage) {
    result.limit = quotasService.getQuota('sqlBinaryPreviewMaxLength');
    result.shouldShowLimit = true;
  }

  if (isBlob) {
    result.limit = quotasService.getQuota('sqlBinaryPreviewMaxLength');
    result.shouldShowLimit = false;
  }

  return result;
}
