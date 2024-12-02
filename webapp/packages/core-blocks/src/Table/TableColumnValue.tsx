/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useContext } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import { EventTableItemExpandFlag } from './EventTableItemExpandFlag.js';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag.js';
import style from './TableColumnValue.module.css';
import { TableContext } from './TableContext.js';
import { TableItemContext } from './TableItemContext.js';

type Props = {
  align?: 'left' | 'center' | 'right' | 'justify' | 'char';
  className?: string;
  centerContent?: boolean;
  ellipsis?: boolean;
  flex?: boolean;
  expand?: boolean;
  nowrap?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
} & React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableCellElement>, HTMLTableCellElement>;

export const TableColumnValue = observer<Props, HTMLTableCellElement>(
  forwardRef(function TableColumnValue(
    { align, children, centerContent, ellipsis, flex, expand, nowrap, className, onClick, onDoubleClick, ...rest },
    ref,
  ) {
    const tableContext = useContext(TableContext);
    const context = useContext(TableItemContext);
    const props = useObjectRef({ onClick, onDoubleClick });
    const styles = useS(style);

    const handleClick = useCallback(
      (event: React.MouseEvent<HTMLTableCellElement>) => {
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
      },
      [tableContext, context, expand],
    );

    const handleDoubleClick = useCallback((event: React.MouseEvent<HTMLTableCellElement>) => {
      props.onDoubleClick?.();
    }, []);

    if (!context) {
      return null;
    }

    return (
      <td
        ref={ref}
        align={align}
        className={s(styles, { centerContent, ellipsis, nowrap, cell: true }, className)}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        {...rest}
      >
        {flex && <div className={s(styles, { tdFlex: true, centerContent, ellipsis }, className)}>{children}</div>}
        {!flex && children}
      </td>
    );
  }),
);
