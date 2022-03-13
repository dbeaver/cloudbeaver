/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';
import styled, { use } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';

import { useObjectRef } from '../useObjectRef';
import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';
import { EventTableItemExpandFlag } from './EventTableItemExpandFlag';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext } from './TableItemContext';

type Props = {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char';
  className?: string;
  centerContent?: boolean;
  ellipsis?: boolean;
  flex?: boolean;
  expand?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
} & React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;

export const TableColumnValue = observer<Props, HTMLTableDataCellElement>(function TableColumnValue({
  align,
  children,
  centerContent,
  ellipsis,
  flex,
  expand,
  className,
  onClick,
  onDoubleClick,
  ...rest
}, ref) {
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);
  const props = useObjectRef({ onClick, onDoubleClick });

  const handleClick = useCallback((event: React.MouseEvent<HTMLTableDataCellElement>) => {
    if (!context) {
      return;
    }

    if (expand && !EventContext.has(event, EventTableItemExpandFlag)) {
      const state = !context.isExpanded();
      EventContext.set(event, EventTableItemExpandFlag, state);
      EventContext.set(event, EventTableItemSelectionFlag);
      tableContext?.setItemExpand(context.item, state);
    }

    props.onClick?.();
  }, [tableContext, context, expand]);

  const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLTableDataCellElement>) => {
    props.onDoubleClick?.();
  }, []);

  if (!context) {
    return null;
  }

  return styled(BASE_TABLE_STYLES)(
    <td
      align={align}
      className={className}
      {...use({ centerContent, ellipsis })}
      ref={ref}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      {...rest}
    >
      {flex && <td-flex className={className}>{children}</td-flex>}
      {!flex && children}
    </td>
  );
}, { forwardRef: true });
