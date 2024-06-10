/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultSetDataContentAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataContentAction';
import type { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import type { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';

interface Args {
  contentAction: ResultSetDataContentAction;
  formatAction: ResultSetFormatAction;
  selectAction: ResultSetSelectAction;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  resultIndex: number;
}

export function preprocessTextValueReadonly({ contentAction, formatAction, selectAction, model, resultIndex }: Args) {
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
