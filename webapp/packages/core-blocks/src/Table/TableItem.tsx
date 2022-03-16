/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext, useCallback, useMemo, Children } from 'react';
import styled, { use } from 'reshadow';

import { EventContext } from '@cloudbeaver/core-events';

import { getComputed } from '../getComputed';
import { useObjectRef } from '../useObjectRef';
import { BASE_TABLE_STYLES } from './BASE_TABLE_STYLES';
import { EventTableItemSelectionFlag } from './EventTableItemSelectionFlag';
import { TableContext } from './TableContext';
import { TableItemContext, ITableItemContext } from './TableItemContext';

interface ExpandProps {
  item: any;
}

interface Props {
  item: any;
  expandElement?: React.FunctionComponent<ExpandProps>;
  selectOnItem?: boolean;
  selectDisabled?: boolean;
  disabled?: boolean;
  title?: string;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const TableItem = observer<Props>(function TableItem({
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

  if (!context) {
    throw new Error('TableContext must be provided');
  }

  const selectionDisabled = selectDisabled || getComputed(() => (!!context.state.isItemSelectable && ((
    context.state.selectableItems.length > 0 && !context.state.selectableItems.includes(item)
  ) || !context.state.isItemSelectable(item))));

  const itemContext = useMemo<ITableItemContext>(() => ({
    item,
    selectDisabled: selectionDisabled,
    isSelected: () => !!context.selectedItems.get(item),
    isExpanded: () => !!context.expandedItems.get(item),
  }), [item, selectionDisabled]);

  const isSelected = itemContext.isSelected();
  const isExpanded = itemContext.isExpanded();

  const ref = useObjectRef({ isSelected, itemContext, context, onClick });

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      const { isSelected, itemContext, context, onClick } = ref;

      if (props.selectOnItem && !itemContext.selectDisabled && !EventContext.has(event, EventTableItemSelectionFlag)) {
        context.setItemSelect(itemContext.item, !isSelected);
      }

      if (onClick) {
        onClick();
      }
    },
    []
  );

  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLTableRowElement>) => {
    if (onDoubleClick) {
      onDoubleClick();
    }
  }, [onDoubleClick]);

  const ExpandElement = expandElement;

  return styled(BASE_TABLE_STYLES)(
    <TableItemContext.Provider value={itemContext}>
      <tr
        title={title}
        className={className}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        {...use({ selected: isSelected, expanded: isExpanded, disabled })}
      >
        {children}
      </tr>
      {isExpanded && ExpandElement && (
        <tr {...use({ noHover: true, expanded: isExpanded })}>
          <td colSpan={Children.count(children)} {...use({ expandArea: true })}>
            <ExpandElement item={item} />
          </td>
        </tr>
      )}
    </TableItemContext.Provider>
  );
});
