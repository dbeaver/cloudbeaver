/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import {
  useContext, useCallback, useMemo, Children
} from 'react';
import styled, { use } from 'reshadow';

import { useStyles } from '@cloudbeaver/core-theming';

import { TableContext } from './TableContext';
import { TableItemContext, ITableItemContext } from './TableItemContext';

type ExpandProps = {
  item: any;
}

type Props = React.PropsWithChildren<{
  item: any;
  expandElement?: React.FunctionComponent<ExpandProps>;
  selectDisabled?: boolean;
  className?: string;
  onClick?: () => void;
  onDoubleClick?: () => void;
}>

export const TableItem = observer(function TableItem({
  item,
  expandElement,
  selectDisabled = false,
  children,
  className,
  onClick,
  onDoubleClick,
}: Props) {
  const styles = useStyles();
  const context = useContext(TableContext);
  if (!context) {
    return null;
  }

  const itemContext = useMemo<ITableItemContext>(() => ({
    item,
    selectDisabled,
    isSelected: () => !!context.selectedItems.get(item),
    isExpanded: () => !!context.expandedItems.get(item),
  }), [item, selectDisabled]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLTableRowElement>) => {
      if (!selectDisabled) {
        event.stopPropagation();
        const isSelected = context.selectedItems.get(item);
        context.setItemSelect(item, !isSelected);
      }

      if (onClick) {
        onClick();
      }
    },
    [context, item, selectDisabled, onClick]
  );
  const handleDoubleClick = useCallback((e: React.MouseEvent<HTMLTableRowElement>) => {
    if (onDoubleClick) {
      onDoubleClick();
    }
  }, [onDoubleClick]);

  const isSelected = itemContext.isSelected();
  const isExpanded = itemContext.isExpanded();
  const ExpandElement = expandElement;

  return styled(styles)(
    <TableItemContext.Provider value={itemContext}>
      <tr
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        className={className}
        {...use({ selected: isSelected, expanded: isExpanded })}
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
