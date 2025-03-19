/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DatabaseEditChangeType } from '../../DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey.js';
import type { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction.js';
import type { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction.js';
import type { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { ResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';

interface Args {
  contentAction: ResultSetDataContentAction;
  formatAction: ResultSetFormatAction;
  model: IDatabaseDataModel<ResultSetDataSource>;
  resultIndex: number;
  cell: IResultSetElementKey | undefined;
  editAction: ResultSetEditAction;
}

export function isTextValueReadonly({ contentAction, formatAction, model, resultIndex, cell, editAction }: Args) {
  if (!cell) {
    return true;
  }

  return (
    model.isReadonly(resultIndex) ||
    model.isDisabled(resultIndex) ||
    (formatAction.isReadOnly(cell) && editAction.getElementState(cell) !== DatabaseEditChangeType.add) ||
    formatAction.isBinary(cell) ||
    formatAction.isGeometry(cell) ||
    contentAction.isTextTruncated(cell)
  );
}
