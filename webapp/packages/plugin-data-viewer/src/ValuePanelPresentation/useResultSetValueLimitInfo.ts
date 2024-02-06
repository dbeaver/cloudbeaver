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
import { useResultActions } from '../DatabaseDataModel/Actions/ResultSet/useResultActions';
import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../DatabaseDataModel/IDatabaseResultSet';

interface IArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  elementKey?: IResultSetElementKey;
}

export function useResultSetValueLimitInfo({ resultIndex, model, elementKey }: IArgs) {
  const { formatAction } = useResultActions({ model, resultIndex });
  const isTextColumn = elementKey ? formatAction.isText(elementKey) : false;
  const isBlob = elementKey ? formatAction.isBinary(elementKey) : false;
  const isImage = elementKey ? formatAction.isImage(elementKey) : false;
  const quotasService = useService(QuotasService);
  let limit: number | undefined = undefined;

  if (isTextColumn) {
    limit = quotasService.getQuota('sqlTextPreviewMaxLength');
  }

  if (isImage) {
    limit = quotasService.getQuota('sqlBinaryPreviewMaxLength');
  }

  if (isBlob) {
    limit = quotasService.getQuota('sqlBinaryPreviewMaxLength');
  }

  return limit;
}
