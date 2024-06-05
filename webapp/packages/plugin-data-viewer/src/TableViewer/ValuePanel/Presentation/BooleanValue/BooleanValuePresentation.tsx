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
import { isDefined } from '@cloudbeaver/core-utils';

import { getResultSetActions } from '../../../../DatabaseDataModel/Actions/ResultSet/getResultSetActions';
import type { IDatabaseResultSet } from '../../../../DatabaseDataModel/IDatabaseResultSet';
import type { IDataValuePanelProps } from '../../DataValuePanelService';
import classes from './BooleanValuePresentation.module.css';
import { useValuePanelBooleanValue } from './useValuePanelBooleanValue';

export const BooleanValuePresentation: TabContainerPanelComponent<IDataValuePanelProps<any, IDatabaseResultSet>> = observer(
  function BooleanValuePresentation({ model, resultIndex }) {
    const translate = useTranslate();

    const { selectAction, viewAction, editAction, formatAction } = getResultSetActions({ model, resultIndex });

    const activeElements = selectAction.getActiveElements();
    const value = useValuePanelBooleanValue(model, resultIndex);

    if (activeElements.length === 0) {
      throw new Error('No active elements');
    }

    if (!isDefined(value)) {
      return <TextPlaceholder>{translate('data_viewer_presentation_value_boolean_placeholder')}</TextPlaceholder>;
    }

    const firstSelectedCell = activeElements[0];
    const column = viewAction.getColumn(firstSelectedCell.column);
    const nullable = column?.required === false;
    const readonly = model.isReadonly(resultIndex) || model.isDisabled(resultIndex) || formatAction.isReadOnly(firstSelectedCell);

    return (
      <div className={classes.container}>
        <Radio
          className={classes.radio}
          id="true_value"
          mod={['primary']}
          checked={value === true}
          disabled={readonly}
          onClick={() => editAction.set(firstSelectedCell, true)}
        >
          TRUE
        </Radio>
        <Radio
          className={classes.radio}
          id="false_value"
          mod={['primary']}
          checked={value === false}
          disabled={readonly}
          onClick={() => editAction.set(firstSelectedCell, false)}
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
            onClick={() => editAction.set(firstSelectedCell, null)}
          >
            NULL
          </Radio>
        )}
      </div>
    );
  },
);
