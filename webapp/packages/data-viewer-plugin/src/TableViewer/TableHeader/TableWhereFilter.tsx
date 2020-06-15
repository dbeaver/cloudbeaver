/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { InputField, IconButton, SubmittingForm } from '@dbeaver/core/blocks';
import { useTranslate } from '@dbeaver/core/localization';
import { composes, useStyles } from '@dbeaver/core/theming';

import { TableViewerModel } from '../TableViewerModel';

const styles = composes(
  css`
    IconButton {
      composes: theme-text-primary theme-ripple from global;
    }
  `,
  css`
    SubmittingForm {
      height: 40px;
      flex: 1;
      display: flex;
      align-items: center;
    }
    InputField {
      flex: 1;
    }
    IconButton {
      margin-right: 14px;
      position: relative;
      height: 24px;
      width: 24px;
      display: block;
    }
  `
);

type Props = {
  context: TableViewerModel;
}

export const TableWhereFilter = observer(function TableWhereFilter({
  context,
}: Props) {
  const translate = useTranslate();
  const handleChange = useCallback(
    (value: string) => context.setQueryWhereFilter(value),
    [context]
  );
  const resetFilter = useCallback(
    () => {
      context.setQueryWhereFilter('');
      context.applyQueryFilters();
    },
    [context]
  );

  return styled(useStyles(styles))(
    <SubmittingForm onSubmit={() => context.applyQueryFilters()}>
      <InputField
        type='text'
        name='whereFilter'
        placeholder={translate('table_header_sql_expression')}
        value={context.getQueryWhereFilter() || ''}
        onChange={handleChange}
        mod='surface'
      />
      <IconButton name='apply' viewBox='' onClick={() => context.applyQueryFilters()}/>
      <IconButton name='reject' viewBox='' onClick={resetFilter}/>
    </SubmittingForm>
  );
});
