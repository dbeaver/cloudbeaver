/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { QuotasService } from '@cloudbeaver/core-root';

import { isResultSetBinaryFileValue } from '../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryFileValue';
import { useResultActions } from '../DatabaseDataModel/Actions/ResultSet/useResultActions';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../DatabaseDataModel/IDatabaseResultSet';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}

export function useContentLimit({ resultIndex, model }: IUseTextValueArgs) {
  const { formatAction, dataAction, selectAction } = useResultActions({ model, resultIndex });
  const activeElements = selectAction.getActiveElements();
  const firstSelectedCell = activeElements?.[0];
  const columnType = firstSelectedCell ? dataAction.getColumn(firstSelectedCell.column)?.dataKind : '';
  const isTextColumn = columnType?.toLocaleLowerCase() === 'string';
  const blobCandidate = firstSelectedCell ? formatAction.get(firstSelectedCell) : null;
  const isBlob = isResultSetBinaryFileValue(blobCandidate);
  const quotasService = useService(QuotasService);
  const result = {
    limit: undefined as undefined | number,
    shouldShowLimit: false,
  };

  if (isTextColumn) {
    result.limit = quotasService.getQuota('sqlTextPreviewMaxLength');
    result.shouldShowLimit = true;
  }

  if (isBlob) {
    result.limit = quotasService.getQuota('sqlBinaryPreviewMaxLength');
    result.shouldShowLimit = false;
  }

  return result;
}
