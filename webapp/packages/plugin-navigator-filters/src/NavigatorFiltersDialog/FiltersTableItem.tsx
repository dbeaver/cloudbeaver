/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { ACTION_ICON_BUTTON_STYLES, IconButton, StaticImage, TableColumnValue, TableItem, useStyles } from '@cloudbeaver/core-blocks';

interface Props {
  id: string;
  name: string;
  icon?: string;
  disabled?: boolean;
  iconTooltip?: string;
  tooltip?: string;
  willBeDeleted?: boolean;
  className?: string;
  onDelete: (id: string) => void;
}

const style = css`
  StaticImage {
    display: flex;
    width: 24px;
  }
  TableColumnValue {
    height: 36px;
  }
  TableColumnValue[|willBeDeleted] {
    text-decoration: line-through;
    opacity: 0.7;
  }
`;

const ICON_BUTTON_STYLES = css`
  IconButton {
    & Icon,
    & StaticImage {
      transition: transform 0.2s ease-in-out;
    }

    &[|willBeDeleted] Icon,
    &[|willBeDeleted] StaticImage {
      transform: rotate(45deg);
    }
  }
`;

export const FiltersTableItem = observer<Props>(function FiltersTableItem({ id, name, disabled, className, onDelete }) {
  return styled(useStyles(style, ACTION_ICON_BUTTON_STYLES, ICON_BUTTON_STYLES))(
    <TableItem item={id} title={name} disabled={disabled} selectDisabled={disabled} className={className}>
      <TableColumnValue>{name}</TableColumnValue>
      <TableColumnValue centerContent flex>
        <IconButton style={ICON_BUTTON_STYLES} name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>,
  );
});
