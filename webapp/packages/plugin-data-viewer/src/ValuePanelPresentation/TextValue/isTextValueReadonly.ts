/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetDataKey';
import type { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import type { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';

interface Args {
  contentAction: ResultSetDataContentAction;
  formatAction: ResultSetFormatAction;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
  cell: IResultSetElementKey | undefined;
}

export function isTextValueReadonly({ contentAction, formatAction, model, resultIndex, cell }: Args) {
  if (!cell) {
    return true;
  }

  return (
    formatAction.isReadOnly(cell) ||
    formatAction.isBinary(cell) ||
    formatAction.isGeometry(cell) ||
    contentAction.isTextTruncated(cell) ||
    model.isReadonly(resultIndex) ||
    model.isDisabled(resultIndex)
  );
}
