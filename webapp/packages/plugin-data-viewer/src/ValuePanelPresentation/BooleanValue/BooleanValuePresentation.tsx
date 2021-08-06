/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Radio, TabContainerPanelComponent, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { ResultSetDataAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetDataAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import { isStringifiedBoolean } from './isBooleanValuePresentationAvailable';

const styles = css`
  container {
    display: flex;
    flex-direction: column;
  }
  Radio {
    padding: 0;
  }
`;

export const BooleanValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(function BooleanValuePresentation({
  model,
  resultIndex,
}) {
  const translate = useTranslate();
  const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
  const selectedCells = selection.getSelectedElements();
  const focusCell = selection.getFocusedElement();

  if (!selectedCells.length && !focusCell) {
    return null;
  }

  let value: boolean | null | undefined;

  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getEditor(resultIndex);

  const firstSelectedCell = selectedCells[0] || focusCell;
  const cellValue = editor.getCell(firstSelectedCell.row, firstSelectedCell.column);

  if (typeof cellValue === 'string' && isStringifiedBoolean(cellValue)) {
    value = cellValue.toLowerCase() === 'true';
  } else if (typeof cellValue === 'boolean' || cellValue === null) {
    value = cellValue;
  }

  if (value === undefined) {
    return <TextPlaceholder>{translate('data_viewer_presentation_value_boolean_placeholder')}</TextPlaceholder>;
  }

  const format = model.source.getAction(resultIndex, ResultSetFormatAction);

  const column = data.getColumn(firstSelectedCell.column);
  const nullable = column?.required === false;
  const readonly = model.isReadonly() || model.isDisabled(resultIndex) || format.isReadOnly(firstSelectedCell);

  return styled(styles)(
    <container>
      <Radio
        id='true_value'
        mod={['primary']}
        checked={value === true}
        disabled={readonly}
        onClick={() => editor.setCell(firstSelectedCell.row, firstSelectedCell.column, true)}
      >
        TRUE
      </Radio>
      <Radio
        id='false_value'
        mod={['primary']}
        checked={value === false}
        disabled={readonly}
        onClick={() => editor.setCell(firstSelectedCell.row, firstSelectedCell.column, false)}
      >
        FALSE
      </Radio>
      {nullable && (
        <Radio
          id='null_value'
          mod={['primary']}
          checked={value === null}
          disabled={readonly}
          onClick={() => editor.setCell(firstSelectedCell.row, firstSelectedCell.column, null)}
        >
        NULL
        </Radio>
      )}
    </container>
  );
});
