/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getResultSetActions } from '../../../../DatabaseDataModel/Actions/ResultSet/getResultSetActions';
import type { IDatabaseDataModel } from '../../../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../../../DatabaseDataModel/IDatabaseResultSet';

interface Args {
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
}

export function useTextValueReadonly({ model, resultIndex }: Args) {
  const { selectAction, formatAction, contentAction } = getResultSetActions({ model, resultIndex });
  const activeElements = selectAction.getActiveElements();
  const firstSelectedCell = activeElements.length ? activeElements[0] : undefined;

  if (!firstSelectedCell) {
    return true;
  }

  return (
    formatAction.isReadOnly(firstSelectedCell) ||
    formatAction.isBinary(firstSelectedCell) ||
    formatAction.isGeometry(firstSelectedCell) ||
    contentAction.isTextTruncated(firstSelectedCell) ||
    model.isReadonly(resultIndex) ||
    model.isDisabled(resultIndex)
  );
}
