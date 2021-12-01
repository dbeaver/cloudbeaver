/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { InlineEditor } from '@cloudbeaver/core-app';
import { PlaceholderComponent, useObjectRef } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { ResultSetConstraintAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import type { ITableHeaderPlaceholderProps } from './TableHeaderService';

const styles = composes(
  css`
    InlineEditor {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    InlineEditor {
      flex: 1;
      height: 24px;
    }
  `
);

export const TableWhereFilter: PlaceholderComponent<ITableHeaderPlaceholderProps> = observer(function TableWhereFilter({
  model,
  resultIndex,
}) {
  const translate = useTranslate();
  const hasResult = model.source.hasResult(resultIndex);
  let filterValue = model.source.options?.whereFilter || '';
  let supported = false;

  if (hasResult) {
    const constraints = model.source.tryGetAction(resultIndex, ResultSetConstraintAction);
    supported = constraints?.supported || false;
    if (constraints && constraints.filterConstraints.length > 0 && model.source.requestInfo.requestFilter) {
      filterValue = model.source.requestInfo.requestFilter;
    }
  }

  const setValue = useCallback((filterValue: string) => {
    model.source.options.whereFilter = filterValue;

    const constraints = model.source.tryGetAction(resultIndex, ResultSetConstraintAction);
    constraints?.deleteFilters();
  }, [model.source.options]);

  const props = useObjectRef({ model, resultIndex, filterValue });

  const handleApply = useCallback(() => {
    const { model, resultIndex } = props;
    if (model.isLoading() || model.isDisabled(resultIndex)) {
      return;
    }
    model.refresh();
  }, []);

  const resetFilter = useCallback(async () => {
    const { model, resultIndex } = props;
    const constraints = model.source.getAction(resultIndex, ResultSetConstraintAction);
    if (model.isLoading() || model.isDisabled(resultIndex)) {
      return;
    }

    await model.requestDataAction(() =>
      constraints.deleteDataFilters()
    );

    const applyNeeded = !!model.requestInfo.requestFilter;
    if (applyNeeded) {
      await model.refresh();
    }
  }, []);

  return styled(useStyles(styles))(
    <InlineEditor
      name="data_where"
      value={filterValue}
      placeholder={translate('table_header_sql_expression')}
      controlsPosition='inside'
      edited={!!filterValue}
      disableSave={model.source.options?.whereFilter === model.source.requestInfo.requestFilter}
      disabled={!supported || model.isLoading() || model.isDisabled(resultIndex)}
      simple
      onSave={handleApply}
      onUndo={resetFilter}
      onChange={setValue}
    />
  );
});
