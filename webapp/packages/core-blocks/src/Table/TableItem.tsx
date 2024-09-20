/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Children, useCallback, useContext, useMemo } from 'react';

import { EventContext } from '@cloudbeaver/core-events';

import { getComputed } from '../getComputed.js';
import { Loader } from '../Loader/Loader.js';
import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag.js';
import cellStyles from './TableColumnValue.module.css';
import { TableContext } from './TableContext.js';
import rowStyles from './TableItem.module.css';
import { type ITableItemContext, TableItemContext } from './TableItemContext.js';

export interface TableItemExpandProps<T> {
  item: T;
  onClose: () => void;
}

interface Props<T> extends React.PropsWithChildren {
  item: T;
  expandElement?: React.FunctionComponent<TableItemExpandProps<T>>;
  selectOnItem?: boolean;
  selectDisabled?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

interface ITableItemComponent {
  <T>(props: Props<T>): React.ReactElement<any, any> | null;
}

export const TableItem: ITableItemComponent = observer(function TableItem({
  item,
  expandElement,
  selectOnItem,
  selectDisabled = false,
  disabled,
  children,
  title,
  className,
  onClick,
  onDoubleClick,
}) {
  const context = useContext(TableContext);
  const props = useObjectRef({ selectOnItem });
  const styles = useS(rowStyles, cellStyles);

  if (!context) {
    throw new Error('TableContext must be provided');
  }

  const selectionDisabled =
    selectDisabled ||
    getComputed(
      () =>
        !!context.state.isItemSelectable &&
        ((context.state.selectableItems.length > 0 && !context.state.selectableItems.includes(item)) || !context.state.isItemSelectable(item)),
    );

  const itemContext = useMemo<ITableItemContext>(
    () => ({
      item,
      selectDisabled: selectionDisabled,
      isSelected: () => !!context.selectedItems.get(item),
      isExpanded: () => !!context.expandedItems.get(item),
    }),
    [item, selectionDisabled],
  );

  const isSelected = itemContext.isSelected();
  const isExpanded = itemContext.isExpanded();

  const ref = useObjectRef({ isSelected, itemContext, context, onClick });

  const handleClick = useCallback((event: React.MouseEvent<HTMLTableRowElement>) => {
    const { isSelected, itemContext, context, onClick } = ref;

    if (props.selectOnItem && !itemContext.selectDisabled && !EventContext.has(event, EventTableItemSelectionFlag)) {
      context.setItemSelect(itemContext.item, !isSelected);
    }

    if (onClick) {
      onClick();
    }
  }, []);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLTableRowElement>) => {
      if (onDoubleClick) {
        onDoubleClick();
      }
    },
    [onDoubleClick],
  );

  const handleClose = useCallback(() => {
    context.setItemExpand(item, false);
  }, [context, item]);

  const ExpandElement = expandElement;

  return (
    <TableItemContext.Provider value={itemContext}>
      <tr
        title={title}
        className={s(styles, { selected: isSelected, expanded: isExpanded, disabled, row: true }, className)}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        {children}
      </tr>
      {isExpanded && ExpandElement && (
        <tr className={s(styles, { noHover: true, expanded: isExpanded, row: true })}>
          <td colSpan={Children.toArray(children).length} className={s(styles, { expandArea: true, cell: true })}>
            <Loader suspense>
              <ExpandElement item={item} onClose={handleClose} />
            </Loader>
          </td>
        </tr>
      )}
    </TableItemContext.Provider>
  );
});
