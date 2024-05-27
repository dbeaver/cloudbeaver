/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Radio, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import { ResultSetEditAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetEditAction';
import { ResultSetFormatAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetFormatAction';
import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService';
import classes from './BooleanValuePresentation.m.css';
import { isStringifiedBoolean } from './isBooleanValuePresentationAvailable';

export const BooleanValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function BooleanValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();
    const selection = model.source.getAction(resultIndex, ResultSetSelectAction);
    const activeElements = selection.getActiveElements();

    if (activeElements.length === 0) {
      return null;
    }

    let value: boolean | null | undefined;

    const view = model.source.getAction(resultIndex, ResultSetViewAction);
    const editor = model.source.getAction(resultIndex, ResultSetEditAction);

    const firstSelectedCell = activeElements[0];
    const cellValue = view.getCellValue(firstSelectedCell);

    if (typeof cellValue === 'string' && isStringifiedBoolean(cellValue)) {
      value = cellValue.toLowerCase() === 'true';
    } else if (typeof cellValue === 'boolean' || cellValue === null) {
      value = cellValue;
    }

    if (value === undefined) {
      return <TextPlaceholder>{translate('data_viewer_presentation_value_boolean_placeholder')}</TextPlaceholder>;
    }

    const format = model.source.getAction(resultIndex, ResultSetFormatAction);

    const column = view.getColumn(firstSelectedCell.column);
    const nullable = column?.required === false;
    const readonly = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || format.isReadOnly(firstSelectedCell);

    return (
      <div className={classes.container}>
        <Radio
          className={classes.radio}
          id="true_value"
          mod={['primary']}
          checked={value === true}
          disabled={readonly}
          onClick={() => editor.set(firstSelectedCell, true)}
        >
          TRUE
        </Radio>
        <Radio
          className={classes.radio}
          id="false_value"
          mod={['primary']}
          checked={value === false}
          disabled={readonly}
          onClick={() => editor.set(firstSelectedCell, false)}
        >
          FALSE
        </Radio>
        {nullable && (
          <Radio
            className={classes.radio}
            id="null_value"
            mod={['primary']}
            checked={value === null}
            disabled={readonly}
            onClick={() => editor.set(firstSelectedCell, null)}
          >
            NULL
          </Radio>
        )}
      </div>
    );
  },
);
