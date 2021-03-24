/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { InlineEditor } from '@cloudbeaver/core-app';
import type { PlaceholderComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

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
}) {
  const translate = useTranslate();
  const [filterValue, setValue] = useState(() => model.source.options?.whereFilter || '');

  const handleApply = useCallback(() => {
    if (model.isLoading()) {
      return;
    }
    model.source.options!.whereFilter = filterValue;
    model.refresh();
  }, [model, filterValue]);

  const resetFilter = useCallback(() => {
    if (model.isLoading()) {
      return;
    }
    const applyNeeded = model.source.options?.whereFilter === filterValue;

    setValue('');

    if (applyNeeded) {
      model.source.options!.whereFilter = '';
      model.refresh();
    }
  }, [model, filterValue]);

  return styled(useStyles(styles))(
    <InlineEditor
      name="data_where"
      value={filterValue}
      placeholder={translate('table_header_sql_expression')}
      controlsPosition='inside'
      edited={!!filterValue}
      disabled={model.isLoading() || model.source.results.length > 1}
      simple
      onSave={handleApply}
      onUndo={resetFilter}
      onChange={setValue}
    />
  );
});
