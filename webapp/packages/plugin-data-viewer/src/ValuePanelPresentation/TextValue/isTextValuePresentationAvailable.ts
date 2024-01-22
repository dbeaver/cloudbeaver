/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isResultSetBinaryFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryFileValue';
import { isResultSetContentValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetContentValue';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseDataResult } from '../../DatabaseDataModel/IDatabaseDataResult';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';

export function isBlobPresentationAvailable(context: IDataValuePanelProps<any, IDatabaseDataResult> | undefined): boolean {
  if (!context?.model.source.hasResult(context.resultIndex)) {
    return true;
  }

  const selection = context.model.source.getAction(context.resultIndex, ResultSetSelectAction);

  const activeElements = selection.getActiveElements();

  if (activeElements.length > 0) {
    const view = context.model.source.getAction(context.resultIndex, ResultSetViewAction);

    const firstSelectedCell = activeElements[0];

    const cellValue = view.getCellValue(firstSelectedCell);

    return isResultSetContentValue(cellValue) && isResultSetBinaryFileValue(cellValue);
  }

  return false;
}
