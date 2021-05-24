/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { IconOrImage } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ESortMode, getNextSortMode, IDatabaseDataModel, IDatabaseDataResult, ResultSetSortAction } from '@cloudbeaver/plugin-data-viewer';

const styles = css`
  sort-button {
    margin-left: 4px;
    display: flex;
    padding: 2px 4px;
    flex-direction: column;
    align-content: center;
    align-items: center;
    min-width: 20px;
    box-sizing: border-box;
    cursor: pointer;
  }
  sort-button > IconOrImage {
    width: 8px;
  }
  sort-button:hover > IconOrImage {
    width: 9px;
  }
  sort-button[|disabled] {
    opacity: 0.7;
    cursor: default;
  }
`;

interface Props {
  model: IDatabaseDataModel<any, IDatabaseDataResult>;
  resultIndex: number;
  columnName: string;
  className?: string;
}

export const SortButton: React.FC<Props> = observer(function SortButtton({
  model,
  resultIndex,
  columnName,
  className,
}) {
  const translate = useTranslate();
  const sorting = model.source.getAction(resultIndex, ResultSetSortAction);
  const currentSortMode = sorting.getSortMode(columnName);
  const loading = model.isLoading();

  let icon = '/icons/sort_unknown.png';
  if (currentSortMode === ESortMode.asc) {
    icon = '/icons/sort_increase.png';
  } else if (currentSortMode === ESortMode.desc) {
    icon = '/icons/sort_decrease.png';
  }

  const handleSort = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (loading) {
      return;
    }

    const nextSortMode = getNextSortMode(currentSortMode);
    sorting.setSortMode(columnName, nextSortMode, e.ctrlKey || e.metaKey);
    model.refresh();
  };

  return styled(styles)(
    <sort-button
      as='div'
      title={translate('data_grid_table_tooltip_column_header_sort')}
      className={className}
      onClick={handleSort}
      {...use({ disabled: loading })}
    >
      <IconOrImage icon={icon} />
    </sort-button>
  );
});
