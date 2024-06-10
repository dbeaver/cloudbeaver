/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import { isStringifiedBoolean } from './isBooleanValuePresentationAvailable';

interface Args {
  viewAction: ResultSetViewAction;
  selectAction: ResultSetSelectAction;
}

export function preprocessBooleanValue({ viewAction, selectAction }: Args): boolean | null | undefined {
  const activeElements = selectAction.getActiveElements();

  const firstSelectedCell = activeElements[0];
  const cellValue = viewAction.getCellValue(firstSelectedCell);

  if (typeof cellValue === 'string' && isStringifiedBoolean(cellValue)) {
    return cellValue.toLowerCase() === 'true';
  }

  if (typeof cellValue === 'boolean' || cellValue === null) {
    return cellValue;
  }

  return undefined;
}
