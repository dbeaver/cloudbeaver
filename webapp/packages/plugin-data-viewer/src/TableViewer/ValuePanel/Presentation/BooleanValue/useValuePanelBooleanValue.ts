/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ResultSetSelectAction } from '../../../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseDataModel } from '../../../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../../../DatabaseDataModel/IDatabaseResultSet';
import { isStringifiedBoolean } from './isBooleanValuePresentationAvailable';

export function useValuePanelBooleanValue(model: IDatabaseDataModel<any, IDatabaseResultSet>, resultIndex: number): boolean | null | undefined {
  const view = model.source.getAction(resultIndex, ResultSetViewAction);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const activeElements = selection.getActiveElements();

  const firstSelectedCell = activeElements[0];
  const cellValue = view.getCellValue(firstSelectedCell);

  if (typeof cellValue === 'string' && isStringifiedBoolean(cellValue)) {
    return cellValue.toLowerCase() === 'true';
  }

  if (typeof cellValue === 'boolean' || cellValue === null) {
    return cellValue;
  }

  return undefined;
}
