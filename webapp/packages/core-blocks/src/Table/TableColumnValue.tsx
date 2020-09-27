/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useContext } from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

type Props = React.PropsWithChildren<{
  align?: 'left' | 'center' | 'right' | 'justify' | 'char';
  className?: string;
  centerContent?: boolean;
  flex?: boolean;
  expand?: boolean;
  onClick?(): void;
  onDoubleClick?(): void;
}>

export const TableColumnValue = observer(function TableColumnValue({
  align,
  children,
  centerContent,
  flex,
  expand,
  className,
  onClick,
  onDoubleClick,
}: Props) {
  const styles = useStyles();
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);

  const handleClick = useCallback((event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>) => {
    if (!context) {
      return;
    }

    if (expand) {
      event.stopPropagation();
      const state = !context.isExpanded();
      tableContext?.setItemExpand(context.item, state);
    }

    if (onClick) {
      onClick();
    }
  }, [tableContext, context, expand, onClick]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLTableDataCellElement>) => {
    if (onDoubleClick) {
      onDoubleClick();
    }
  }, [onDoubleClick]);

  if (!context) {
    return null;
  }

  return styled(styles)(
    <td
      align={align}
      className={className}
      {...use({ centerContent })}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {flex && <td-flex as='div'>{children}</td-flex>}
      {!flex && children}
    </td>
  );
});
