/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isNotNullDefined } from '@cloudbeaver/core-utils';

import { isResultSetBinaryFileValue } from '../../DatabaseDataModel/Actions/ResultSet/isResultSetBinaryFileValue';
import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { useAutoFormat } from './useAutoFormat';

interface IUseTextValueArgs {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
  currentContentType: string;
}

export function useTextValue({ model, resultIndex, currentContentType }: IUseTextValueArgs) {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const activeElements = selection.getActiveElements();
  const firstSelectedCell = activeElements?.[0];
  const formatter = useAutoFormat();

  if (!isNotNullDefined(firstSelectedCell)) {
    return '';
  }

  if (editor.isElementEdited(firstSelectedCell)) {
    return format.getText(firstSelectedCell);
  }

  const blob = format.get(firstSelectedCell);

  if (isResultSetBinaryFileValue(blob)) {
    const value = formatter.formatBlob(currentContentType, blob);

    if (value) {
      return value;
    }
  }

  return formatter.format(currentContentType, format.getText(firstSelectedCell));
}
