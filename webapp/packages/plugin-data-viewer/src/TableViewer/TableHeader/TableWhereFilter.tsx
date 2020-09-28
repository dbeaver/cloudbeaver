/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { InlineEditor } from '@cloudbeaver/core-app';
import { SubmittingForm } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { DataModelWrapper } from '../DataModelWrapper';

const styles = composes(
  css`
    InlineEditor {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    SubmittingForm {
      height: 40px;
      flex: 1;
      display: flex;
      align-items: center;
    }
    InlineEditor {
      flex: 1;
      height: 24px;
      margin: 0 12px;
    }
  `
);

type Props = {
  context: DataModelWrapper;
}

export const TableWhereFilter = observer(function TableWhereFilter({
  context,
}: Props) {
  const translate = useTranslate();
  const [filterValue, setValue] = useState(() => context.deprecatedModel.getQueryWhereFilter() || '');

  const handleApply = useCallback(() => {
    context.deprecatedModel.setQueryWhereFilter(filterValue);
    context.deprecatedModel.refresh();
  }, [context, filterValue]);

  const resetFilter = useCallback(
    () => {
      const applyNeeded = context.deprecatedModel.getQueryWhereFilter() === filterValue;

      setValue('');

      if (applyNeeded) {
        context.deprecatedModel.setQueryWhereFilter('');
        context.deprecatedModel.refresh();
      }
    },
    [context, filterValue]
  );

  return styled(useStyles(styles))(
    <SubmittingForm onSubmit={handleApply}>
      <InlineEditor
        name="data_where"
        value={filterValue}
        onSave={handleApply}
        onUndo={resetFilter}
        onChange={setValue}
        placeholder={translate('table_header_sql_expression')}
        controlsPosition='inside'
        edited={!!filterValue}
        simple
      />
    </SubmittingForm>
  );
});
