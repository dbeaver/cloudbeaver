/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, TabContainerPanelComponent, TextareaNew } from '@cloudbeaver/core-blocks';
import { useStyles } from '@cloudbeaver/core-theming';
import { css } from '@reshadow/react';

import type { IResultSetElementKey } from '../../DatabaseDataModel/Actions/ResultSet/IResultSetElementKey';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';

const styles = css`
  TextareaNew {
    flex: 1;
  }
`;

export const TextValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function TextValuePresentation({
  model,
  resultIndex,
}) {
  const result = model.getResult(resultIndex);
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);

  const selectedCells = selection.getSelectedElements();
  const focusCell = selection.getFocusedElement();

  let value: any;
  let stringValue: string | undefined;
  let firstSelectedCell: Required<IResultSetElementKey> | undefined;
  let readonly = true;

  if (result?.data?.rows && (selectedCells.length > 0 || focusCell)) {
    const format = model.source.getAction(resultIndex, ResultSetFormatAction);

    firstSelectedCell = selectedCells[0] || focusCell;
    value = model.source
      .getEditor(resultIndex)
      .getCell(firstSelectedCell.row, firstSelectedCell.column);

    stringValue = format.get(value);
    readonly = format.isReadOnly(firstSelectedCell);
  }

  const handleChange = (value: string) => {
    if (firstSelectedCell) {
      model.source
        .getEditor(resultIndex)
        .setCell(firstSelectedCell.row, firstSelectedCell.column, value);
    }
  };

  return styled(useStyles(styles, BASE_CONTAINERS_STYLES))(
    <TextareaNew
      name="value"
      rows={3}
      value={stringValue}
      disabled={stringValue === undefined}
      readOnly={model.isReadonly() || readonly}
      embedded
      onChange={handleChange}
    />
  );
});
