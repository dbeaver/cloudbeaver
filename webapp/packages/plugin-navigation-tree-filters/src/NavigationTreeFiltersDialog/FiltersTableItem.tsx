/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { ACTION_ICON_BUTTON_STYLES, IconButton, TableColumnValue, TableItem } from '@cloudbeaver/core-blocks';

interface Props {
  id: string;
  name: string;
  disabled?: boolean;
  className?: string;
  onDelete: (id: string) => void;
}

export const FiltersTableItem = observer<Props>(function FiltersTableItem({ id, name, disabled, className, onDelete }) {
  return styled(ACTION_ICON_BUTTON_STYLES)(
    <TableItem item={id} title={name} disabled={disabled} selectDisabled={disabled} className={className}>
      <TableColumnValue>{name}</TableColumnValue>
      <TableColumnValue centerContent flex>
        <IconButton name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>,
  );
});
