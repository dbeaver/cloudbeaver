/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useTranslate } from '@dbeaver/react-translate';
import { clsx, IconButton, Icon } from '@dbeaver/ui-kit';

interface OrderButtonProps {
  sortState?: 'asc' | 'desc' | null;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  tabIndex?: number;
  columnSortingMultiple?: boolean;
}

export function OrderButton({ sortState, onClick, tabIndex, columnSortingMultiple }: OrderButtonProps) {
  const svgSortAsc = 'sort-asc';
  const svgSortDesc = 'sort-desc';
  const svgSortUnknown = 'sort-unknown';
  const translate = useTranslate();

  const iconSrc = sortState === 'asc' ? svgSortAsc : sortState === 'desc' ? svgSortDesc : svgSortUnknown;
  const titleToken = columnSortingMultiple ? 'react_data_grid_order_button_multiple' : 'react_data_grid_order_button';
  const titleDefault = columnSortingMultiple ? 'Click to sort. Hold CTRL/CMD + click for multi-sort' : 'Sort By Column';

  return (
    <IconButton
      variant="secondary"
      size="small"
      tabIndex={tabIndex}
      title={translate(titleToken, titleDefault)}
      aria-label={translate(titleToken, titleDefault)}
      className={clsx(
        'tw:opacity-0 tw:group-focus:opacity-100 tw:focus:opacity-100 tw:group-hover:opacity-100 tw:hover:opacity-100 tw:outline-offset-0',
        sortState && 'tw:opacity-100',
      )}
      onClick={onClick}
    >
      <Icon name={iconSrc} />
    </IconButton>
  );
}
