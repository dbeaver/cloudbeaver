/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResultSetBinaryValue } from '@dbeaver/result-set-api';
import { isResultSetBlobValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBlobValue.js';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction.js';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import { type ITextValuePanelProps } from './TextValuePresentationService.js';

export function isBlobPresentationAvailable(context: ITextValuePanelProps | undefined): boolean {
  const source = context?.model.source;
  if (!context || !source?.hasResult(context.resultIndex)) {
    return true;
  }

  const selection = source.getAction(context.resultIndex, ResultSetSelectAction);

  const activeElements = selection.getActiveElements();

  if (activeElements.length > 0) {
    const view = source.getAction(context.resultIndex, ResultSetViewAction);

    const firstSelectedCell = activeElements[0]!;

    const cellValue = view.getCellValue(firstSelectedCell);

    return isResultSetBinaryValue(cellValue) || isResultSetBlobValue(cellValue);
  }

  return false;
}
