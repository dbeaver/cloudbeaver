/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useContext, useCallback, useMemo } from 'react';
import styled, { use } from 'reshadow';


import { useStyles } from '@dbeaver/core/theming';

import { TableContext } from './TableContext';
import { TableItemContext, ITableItemContext } from './TableItemContext';

type Props = React.PropsWithChildren<{
  item: any;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}>

export const TableItem = observer(function TableItem({
  item, children, className, onClick, onDoubleClick,
}: Props) {
  const context = useContext(TableContext);
  if (!context) {
    return null;
  }

  const itemContext = useMemo<ITableItemContext>(() => ({
    item,
    isSelected: () => !!context.selectedItems.get(item),
  }), [item]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      const isSelected = context.selectedItems.get(item);
      if (!e.ctrlKey) {
        context.clearSelection();
      }

      context.setItemSelect(item, !isSelected);

      if (onClick) {
        onClick();
      }
    },
    [context, item, onClick]
  );
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLTableRowElement>) => {
    if (onDoubleClick) {
      onDoubleClick();
    }
  }, [onDoubleClick]);

  const isSelected = context.selectedItems.get(item);

  return styled(useStyles())(
    <TableItemContext.Provider value={itemContext}>
      <tr onClick={handleClick} onDoubleClick={handleDoubleClick} className={className} {...use({ isSelected })}>
        {children}
      </tr>
    </TableItemContext.Provider>
  );
});
