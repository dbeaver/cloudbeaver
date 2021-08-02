/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { use } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';
import { useStyles } from '@cloudbeaver/core-theming';

import { EventTableItemExpandFlag } from './EventTableItemExpandFlag';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

type Props = {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char';
  className?: string;
  centerContent?: boolean;
  flex?: boolean;
  expand?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
} & React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;

export const TableColumnValue: React.FC<Props> = observer(function TableColumnValue({
  align,
  children,
  centerContent,
  flex,
  expand,
  className,
  onClick,
  onDoubleClick,
  ...rest
}) {
  const styles = useStyles();
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);

  const handleClick = useCallback((event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>) => {
    if (!context) {
      return;
    }

    if (expand && !EventContext.has(event, EventTableItemExpandFlag)) {
      const state = !context.isExpanded();
      EventContext.set(event, EventTableItemExpandFlag, state);
      EventContext.set(event, EventTableItemSelectionFlag);
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
      {...rest}
    >
      {flex && <td-flex className={className}>{children}</td-flex>}
      {!flex && children}
    </td>
  );
});
