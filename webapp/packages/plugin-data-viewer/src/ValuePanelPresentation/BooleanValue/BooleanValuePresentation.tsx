/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Radio, TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { isDefined } from '@dbeaver/js-helpers';

import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';
import type { IDataValuePanelProps } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import classes from './BooleanValuePresentation.module.css';
import { preprocessBooleanValue } from './preprocessBooleanValue.js';
import { DatabaseEditChangeType, IDatabaseDataEditAction } from '../../DatabaseDataModel/Actions/IDatabaseDataEditAction.js';
import { IDatabaseDataSelectAction } from '../../DatabaseDataModel/Actions/IDatabaseDataSelectAction.js';
import { IDatabaseDataViewAction } from '../../DatabaseDataModel/Actions/IDatabaseDataViewAction.js';
import { GridViewAction } from '../../DatabaseDataModel/Actions/Grid/GridViewAction.js';
import { IDatabaseDataFormatAction } from '../../DatabaseDataModel/Actions/IDatabaseDataFormatAction.js';
import { GridSelectAction } from '../../DatabaseDataModel/Actions/Grid/GridSelectAction.js';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';
import { GridEditAction } from '../../DatabaseDataModel/Actions/Grid/GridEditAction.js';

export const BooleanValuePresentation: TabContainerPanelComponent<IDataValuePanelProps> = observer(function BooleanValuePresentation({
  model: unknownModel,
  resultIndex,
}) {
  const model = unknownModel as any;
  if (!isResultSetDataModel(model)) {
    throw new Error('BooleanValuePresentation can be used only with ResultSetDataSource');
  }
  const translate = useTranslate();

  const selectAction = model.source.getAction(resultIndex, IDatabaseDataSelectAction, GridSelectAction);
  const viewAction = model.source.getAction(resultIndex, IDatabaseDataViewAction, GridViewAction);
  const editAction = model.source.getAction(resultIndex, IDatabaseDataEditAction, GridEditAction);
  const formatAction = model.source.getAction(resultIndex, IDatabaseDataFormatAction);

  const activeElements = selectAction.getActiveElements();

  if (activeElements.length === 0) {
    return <TextPlaceholder>{translate('data_viewer_presentation_value_no_active_elements')}</TextPlaceholder>;
  }

  const firstSelectedCell = activeElements[0]!;
  const cellHolder = viewAction.getCellHolder(firstSelectedCell);
  const value = preprocessBooleanValue(cellHolder.value);

  if (!isDefined(value)) {
    return <TextPlaceholder>{translate('data_viewer_presentation_value_boolean_placeholder')}</TextPlaceholder>;
  }

  // TODO: fix nullability detection abstraction
  const column = viewAction.getColumn(firstSelectedCell.column) as SqlResultColumn | undefined;
  const nullable = column?.required === false;
  const readonly =
    model.isReadonly(resultIndex) ||
    model.isDisabled(resultIndex) ||
    (formatAction.isReadOnly(firstSelectedCell) && editAction.getElementState(firstSelectedCell) !== DatabaseEditChangeType.add);
  return (
    <div className={classes['container']}>
      <Radio id="true_value" checked={value === true} disabled={readonly} onClick={() => editAction.set(firstSelectedCell, true)}>
        TRUE
      </Radio>
      <Radio id="false_value" checked={value === false} disabled={readonly} onClick={() => editAction.set(firstSelectedCell, false)}>
        FALSE
      </Radio>
      {nullable && (
        <Radio id="null_value" checked={value === null} disabled={readonly} onClick={() => editAction.set(firstSelectedCell, null)}>
          NULL
        </Radio>
      )}
    </div>
  );
});
