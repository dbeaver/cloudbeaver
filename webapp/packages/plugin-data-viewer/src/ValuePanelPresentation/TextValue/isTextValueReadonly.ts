/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IGridDataKey } from '../../DatabaseDataModel/Actions/Grid/IGridDataKey.js';
import { DatabaseEditChangeType, IDatabaseDataEditAction } from '../../DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import type { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import type { IDatabaseValueHolder } from '../../DatabaseDataModel/Actions/IDatabaseValueHolder.js';
import type { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import type { IResultSetValue } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { ResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';

interface Args {
  contentAction: ResultSetDataContentAction;
  formatAction: IDatabaseDataFormatAction;
  model: IDatabaseDataModel<ResultSetDataSource>;
  resultIndex: number;
  cellHolder: IDatabaseValueHolder<IGridDataKey, IResultSetValue> | undefined;
  editAction: IDatabaseDataEditAction;
}

export function isTextValueReadonly({ contentAction, formatAction, model, resultIndex, cellHolder, editAction }: Args) {
  if (!cellHolder) {
    return true;
  }

  return (
    model.isReadonly(resultIndex) ||
    model.isDisabled(resultIndex) ||
    (formatAction.isReadOnly(cellHolder.key) && editAction.getElementState(cellHolder.key) !== DatabaseEditChangeType.add) ||
    formatAction.isBinary(cellHolder) ||
    formatAction.isGeometry(cellHolder) ||
    contentAction.isTextTruncated(cellHolder)
  );
}
