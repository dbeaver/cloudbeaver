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
}>

export const TableColumnValue = observer(function TableColumnValue({
  align,
  children,
  centerContent,
  flex,
  expand,
  className,
}: Props) {
  const styles = useStyles();
  const tableContext = useContext(TableContext);
  const context = useContext(TableItemContext);

  const handleClick = useCallback((event: React.MouseEvent<HTMLTableDataCellElement, MouseEvent>) => {
    if (!expand || !context) {
      return;
    }

    event.stopPropagation();

    const state = !context.isExpanded();

    tableContext?.setItemExpand(context.item, state);
  }, [tableContext, context, expand]);

  if (!context) {
    return null;
  }

  return styled(styles)(
    <td align={align} className={className} {...use({ centerContent })} onClick={handleClick}>
      {flex && <td-flex as='div'>{children}</td-flex>}
      {!flex && children}
    </td>
  );
});
