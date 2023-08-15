/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconButton, TableColumnValue, TableItem } from '@cloudbeaver/core-blocks';

interface Props {
  id: string;
  name: string;
  className?: string;
  onDelete: (id: string) => void;
}

export const GroupingTableItem = observer<Props>(function GroupingTableItem({ id, name, className, onDelete }) {
  return (
    <TableItem className={className} item={id} title={name}>
      <TableColumnValue width="100%" flex>
        {name}
      </TableColumnValue>
      <TableColumnValue>
        <IconButton name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>
  );
});
